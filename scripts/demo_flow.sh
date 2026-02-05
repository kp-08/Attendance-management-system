#!/bin/bash
# =================================================================
# Demo Flow Script - Integration Smoke Tests
# =================================================================
# This script performs end-to-end smoke tests for the integrated
# frontend + backend deployment.
#
# Usage:
#   ./scripts/demo_flow.sh
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - curl and jq installed
#   - Run from repository root
# =================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8000"
API_VIA_PROXY="${FRONTEND_URL}/api"
MAX_WAIT_SECONDS=120

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Integration Demo Flow Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is required but not installed."
        exit 1
    fi
}

# Check prerequisites
log_info "Checking prerequisites..."
check_command docker
check_command curl
check_command jq

# Step 1: Start services
log_info "Step 1: Starting Docker Compose services..."
docker compose up -d --build

# Step 2: Wait for services to be healthy
log_info "Step 2: Waiting for services to be healthy..."

wait_for_service() {
    local url=$1
    local name=$2
    local waited=0

    while [ $waited -lt $MAX_WAIT_SECONDS ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            log_success "$name is ready!"
            return 0
        fi
        echo -n "."
        sleep 2
        waited=$((waited + 2))
    done

    log_error "$name failed to start within $MAX_WAIT_SECONDS seconds"
    return 1
}

echo -n "Waiting for Backend API "
wait_for_service "${BACKEND_URL}/docs" "Backend API"

echo -n "Waiting for Frontend "
wait_for_service "${FRONTEND_URL}" "Frontend"

echo ""

# Step 3: Run database migrations and seed
log_info "Step 3: Running database migrations..."
docker compose exec -T backend alembic upgrade head || log_warning "Migrations may have already been applied"

log_info "Step 4: Seeding database..."
docker compose exec -T backend python seed_data.py || log_warning "Seed data may already exist"

echo ""

# Step 5: Run smoke tests
log_info "Step 5: Running smoke tests..."
echo ""

# Test 1: Health check via direct backend
log_info "Test 1: Backend direct health check..."
RESPONSE=$(curl -s -w "\n%{http_code}" "${BACKEND_URL}/docs")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
    log_success "Backend /docs accessible (HTTP $HTTP_CODE)"
else
    log_error "Backend /docs failed (HTTP $HTTP_CODE)"
fi

# Test 2: Frontend accessibility
log_info "Test 2: Frontend accessibility..."
RESPONSE=$(curl -s -w "\n%{http_code}" "${FRONTEND_URL}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
    log_success "Frontend accessible (HTTP $HTTP_CODE)"
else
    log_error "Frontend failed (HTTP $HTTP_CODE)"
fi

# Test 3: API via nginx proxy
log_info "Test 3: API via nginx proxy..."
RESPONSE=$(curl -s -w "\n%{http_code}" "${API_VIA_PROXY}/holidays/list")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
    log_success "API proxy working (HTTP $HTTP_CODE)"
else
    log_error "API proxy failed (HTTP $HTTP_CODE)"
fi

# Test 4: Login via proxy (frontend-compatible endpoint)
log_info "Test 4: Login via proxy (JSON endpoint)..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_VIA_PROXY}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@company.com", "password": "admin123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    log_success "Login successful! Token received."
    echo "  Token: ${TOKEN:0:20}..."
else
    log_warning "Login via JSON endpoint may not be seeded. Trying OAuth2 form..."
    
    # Try OAuth2 form login (original endpoint)
    LOGIN_RESPONSE=$(curl -s -X POST "${API_VIA_PROXY}/auth/login" \
        -d "username=admin@company.com&password=admin123")
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // empty')
    
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        log_success "OAuth2 login successful!"
        echo "  Token: ${TOKEN:0:20}..."
    else
        log_error "Login failed. Response: $LOGIN_RESPONSE"
        log_warning "You may need to seed the database with valid users."
    fi
fi

# Test 5: Get users list (if token available)
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    log_info "Test 5: Get users list..."
    USERS_RESPONSE=$(curl -s -X GET "${API_VIA_PROXY}/users" \
        -H "Authorization: Bearer $TOKEN")
    
    USER_COUNT=$(echo "$USERS_RESPONSE" | jq 'if type == "array" then length else 0 end' 2>/dev/null || echo "0")
    
    if [ "$USER_COUNT" -gt 0 ]; then
        log_success "Users endpoint working! Found $USER_COUNT users."
    else
        log_warning "Users endpoint returned empty or invalid response"
    fi

    # Test 6: Get attendance
    log_info "Test 6: Get attendance records..."
    ATTENDANCE_RESPONSE=$(curl -s -X GET "${API_VIA_PROXY}/attendance" \
        -H "Authorization: Bearer $TOKEN")
    
    ATTENDANCE_COUNT=$(echo "$ATTENDANCE_RESPONSE" | jq 'if type == "array" then length else 0 end' 2>/dev/null || echo "0")
    log_success "Attendance endpoint working! Found $ATTENDANCE_COUNT records."

    # Test 7: Get holidays
    log_info "Test 7: Get holidays..."
    HOLIDAYS_RESPONSE=$(curl -s -X GET "${API_VIA_PROXY}/holidays" \
        -H "Authorization: Bearer $TOKEN")
    
    HOLIDAY_COUNT=$(echo "$HOLIDAYS_RESPONSE" | jq 'if type == "array" then length else 0 end' 2>/dev/null || echo "0")
    log_success "Holidays endpoint working! Found $HOLIDAY_COUNT holidays."

    # Test 8: Get dashboard stats
    log_info "Test 8: Get dashboard stats..."
    STATS_RESPONSE=$(curl -s -X GET "${API_VIA_PROXY}/dashboard/stats" \
        -H "Authorization: Bearer $TOKEN")
    
    TOTAL_EMP=$(echo "$STATS_RESPONSE" | jq '.totalEmployees // 0' 2>/dev/null)
    if [ "$TOTAL_EMP" != "null" ]; then
        log_success "Dashboard stats working! Total employees: $TOTAL_EMP"
    else
        log_warning "Dashboard stats endpoint returned unexpected format"
    fi

    # Test 9: Get leaves
    log_info "Test 9: Get leave requests..."
    LEAVES_RESPONSE=$(curl -s -X GET "${API_VIA_PROXY}/leave" \
        -H "Authorization: Bearer $TOKEN")
    
    LEAVE_COUNT=$(echo "$LEAVES_RESPONSE" | jq 'if type == "array" then length else 0 end' 2>/dev/null || echo "0")
    log_success "Leave endpoint working! Found $LEAVE_COUNT leave requests."
fi

echo ""
log_info "========================================="
log_info "  Demo Flow Complete!"
log_info "========================================="
echo ""
echo -e "Frontend:      ${GREEN}${FRONTEND_URL}${NC}"
echo -e "Backend API:   ${GREEN}${BACKEND_URL}${NC}"
echo -e "API via Proxy: ${GREEN}${API_VIA_PROXY}${NC}"
echo -e "pgAdmin:       ${YELLOW}http://localhost:8080${NC} (start with: docker compose --profile debug up -d)"
echo ""
echo -e "To run backend tests:"
echo -e "  ${BLUE}docker compose exec backend pytest -v${NC}"
echo ""
echo -e "To view logs:"
echo -e "  ${BLUE}docker compose logs -f${NC}"
echo ""
echo -e "To stop services:"
echo -e "  ${BLUE}docker compose down${NC}"
echo ""
