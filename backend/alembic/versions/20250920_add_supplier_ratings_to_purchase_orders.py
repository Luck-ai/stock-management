"""Add supplier rating columns to purchase_orders

Revision ID: add_supplier_ratings
Revises: None
Create Date: 2025-09-20 17:30:00.000000

Note: This repository keeps a single consolidated revision file. The
down_revision is set to None so Alembic treats this as the base revision.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_supplier_ratings'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('purchase_orders', sa.Column('on_time_delivery', sa.Integer(), nullable=True))
    op.add_column('purchase_orders', sa.Column('quality_score', sa.Integer(), nullable=True))
    op.add_column('purchase_orders', sa.Column('cost_efficiency', sa.Integer(), nullable=True))
    op.add_column('purchase_orders', sa.Column('overall_rating', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('purchase_orders', 'overall_rating')
    op.drop_column('purchase_orders', 'cost_efficiency')
    op.drop_column('purchase_orders', 'quality_score')
    op.drop_column('purchase_orders', 'on_time_delivery')
