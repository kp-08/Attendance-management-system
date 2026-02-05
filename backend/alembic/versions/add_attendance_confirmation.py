"""Add attendance confirmation fields

Revision ID: add_attendance_confirm
Revises: 6e7a5d0c6bd2
Create Date: 2026-02-04

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_attendance_confirm'
down_revision = '6c8dc8d04bd4'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_confirmed column if it doesn't exist
    try:
        op.add_column('attendance_records', sa.Column('is_confirmed', sa.Boolean(), nullable=True, server_default='false'))
    except Exception:
        pass
    
    # Add confirmed_at column if it doesn't exist
    try:
        op.add_column('attendance_records', sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True))
    except Exception:
        pass


def downgrade():
    try:
        op.drop_column('attendance_records', 'confirmed_at')
    except Exception:
        pass
    try:
        op.drop_column('attendance_records', 'is_confirmed')
    except Exception:
        pass
