# Setup Guide

Complete setup guide for the Enterprise Nexus Frontend.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- A running **FastAPI backend** with PostgreSQL database

## Step-by-Step Setup

### 1. Clone/Extract the Project

If you received this as a ZIP file, extract it to your desired location.

```bash
cd enterprise-nexus-frontend
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory (you can copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and update the API URL:

```env
VITE_API_BASE_URL=http://localhost:8000
```

**Important:** Make sure this URL matches your FastAPI backend URL.

### 4. Verify Backend Connection

Before running the frontend, ensure your FastAPI backend is running and accessible at the URL specified in `.env`.

Test the backend by visiting:
```
http://localhost:8000/docs
```

You should see the FastAPI interactive documentation.

### 5. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173`

### 6. First Login

Use the credentials created in your backend database. If you haven't created any users yet, you'll need to:

1. Create an initial admin user in your database
2. Or use your backend's user creation endpoint

Example initial user:
- Email: `admin@company.com`
- Password: (set in your backend)

## Project Structure Overview

```
frontend-only/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.tsx      # Top navigation bar
│   │   └── Sidebar.tsx     # Side navigation menu
│   │
│   ├── pages/              # Page components (routes)
│   │   ├── LoginPage.tsx           # Login page
│   │   ├── Dashboard.tsx           # Main dashboard
│   │   ├── AttendancePage.tsx      # Attendance management
│   │   ├── LeavePage.tsx           # Leave management
│   │   ├── PhonebookPage.tsx       # Employee directory
│   │   ├── AdminPage.tsx           # Admin panel
│   │   ├── AdminMasterPage.tsx     # Admin master panel
│   │   └── ManagerPage.tsx         # Manager panel
│   │
│   ├── services/           # API service layers
│   │   ├── authService.ts          # Authentication
│   │   ├── userService.ts          # User management
│   │   ├── attendanceService.ts    # Attendance
│   │   ├── leaveService.ts         # Leave management
│   │   ├── holidayService.ts       # Holidays
│   │   └── index.ts                # Service exports
│   │
│   ├── config/
│   │   └── api.ts          # API configuration
│   │
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces
│   │
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
│
├── public/                 # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite config
└── .env                    # Environment variables
```

## Available Scripts

### Development

Start the development server with hot reload:
```bash
npm run dev
```

### Production Build

Build the application for production:
```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

### Linting

Run ESLint to check code quality:
```bash
npm run lint
```

## Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the frontend.

### Available Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | FastAPI backend URL | `http://localhost:8000` |

### Adding New Environment Variables

1. Add to `.env` file with `VITE_` prefix:
```env
VITE_MY_VARIABLE=value
```

2. Access in code:
```typescript
const myVariable = import.meta.env.VITE_MY_VARIABLE;
```

## Integrating with Your Backend

### 1. Update API Endpoints

If your backend uses different endpoint paths, update `src/config/api.ts`:

```typescript
export const API_ENDPOINTS = {
  LOGIN: '/api/v1/auth/login',  // Change to match your backend
  USERS: '/api/v1/users',       // Change to match your backend
  // ... other endpoints
};
```

### 2. Customize Request/Response Format

If your backend uses a different response format, update the `apiRequest` function in `src/config/api.ts`:

```typescript
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  // ... existing code ...
  
  // Customize response handling
  const data = await response.json();
  
  // If your backend wraps responses in a 'data' field:
  return data.data;
  
  // Or return the whole response:
  return data;
};
```

### 3. Update Authentication

If your backend uses a different authentication method:

Edit `src/services/authService.ts`:

```typescript
export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post(API_ENDPOINTS.LOGIN, credentials);
    
    // Customize token storage
    if (response.access_token) {  // If backend returns 'access_token'
      localStorage.setItem('authToken', response.access_token);
    }
    
    return response;
  },
};
```

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - `VITE_API_BASE_URL` = your production API URL

### Deploy to Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to Netlify

3. Set environment variables in Netlify:
   - `VITE_API_BASE_URL` = your production API URL

### Deploy to AWS S3 + CloudFront

1. Build the project:
```bash
npm run build
```

2. Upload `dist` folder to S3 bucket

3. Configure CloudFront distribution

4. Update API URL in environment variables

## Common Issues

### CORS Errors

If you see CORS errors, ensure your FastAPI backend has CORS properly configured:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### API Connection Refused

1. Verify backend is running: `curl http://localhost:8000`
2. Check `.env` file has correct `VITE_API_BASE_URL`
3. Restart dev server after changing `.env`

### Authentication Issues

1. Check token is being stored: Open browser DevTools > Application > Local Storage
2. Verify token format matches backend expectations
3. Check token expiration time

### Build Errors

1. Clear node modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

2. Clear Vite cache:
```bash
rm -rf .vite
npm run dev
```

## Development Tips

### Hot Reload Not Working

- Restart the dev server
- Check file permissions
- Ensure files are being saved

### TypeScript Errors

- Run `npm run build` to see all TypeScript errors
- Update `tsconfig.json` if needed
- Add `// @ts-ignore` for quick fixes (not recommended)

### Debugging API Calls

Add console logs in `src/config/api.ts`:

```typescript
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  console.log('API Request:', endpoint, options);
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  console.log('API Response:', response.status, await response.json());
  
  // ... rest of code
};
```

## Getting Help

- Check the [README.md](README.md) for general information
- Review [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API details
- See [FASTAPI_INTEGRATION.md](FASTAPI_INTEGRATION.md) for backend setup
- Check browser console for errors
- Review Network tab in DevTools for API calls

## Next Steps

After completing setup:

1. ✅ Verify all pages load correctly
2. ✅ Test login/logout functionality
3. ✅ Test API connections
4. ✅ Configure user roles in backend
5. ✅ Set up production environment
6. ✅ Configure monitoring and logging
7. ✅ Set up CI/CD pipeline

## Support

For issues or questions:
1. Check this documentation
2. Review error messages in browser console
3. Check backend logs
4. Create an issue in the repository
