from sqlalchemy.ext.asyncio import AsyncSession
from . import models, schemas
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from typing import List, Optional


async def get_product(db: AsyncSession, product_id: int, user_id: Optional[int] = None) -> Optional[models.Product]:
    stmt = select(models.Product).where(models.Product.id == product_id)
    if user_id is not None:
        stmt = stmt.where(models.Product.user_id == user_id)
    stmt = stmt.options(
        selectinload(models.Product.supplier),
        selectinload(models.Product.category),
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def get_products(db: AsyncSession, skip: int = 0, limit: int = 100, user_id: Optional[int] = None) -> List[models.Product]:
    stmt = select(models.Product)
    if user_id is not None:
        stmt = stmt.where(models.Product.user_id == user_id)
    stmt = stmt.options(
        selectinload(models.Product.supplier),
        selectinload(models.Product.category),
    ).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_product(db: AsyncSession, product: schemas.ProductCreate) -> models.Product:
    data = product.model_dump()
    # Prevent inserting duplicate SKUs by checking existence first
    sku = data.get("sku")
    if sku:
        stmt = select(models.Product).where(models.Product.sku == sku)
        result = await db.execute(stmt)
        if result.scalars().first():
            raise ValueError("SKU already exists")
    db_product = models.Product(**data)
    db.add(db_product)
    try:
        await db.commit()
        await db.refresh(db_product)
    except IntegrityError as e:
        # rollback and raise a simple error that the router can translate
        await db.rollback()
        msg = str(e.orig) if getattr(e, 'orig', None) else str(e)
        if 'sku' in msg.lower():
            raise ValueError("SKU already exists")
        raise ValueError("Database integrity error")
    # reload with selectinload to ensure relationships accessible without IO
    stmt = select(models.Product).where(models.Product.id == db_product.id).options(
        selectinload(models.Product.supplier),
        selectinload(models.Product.category),
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def update_product(db: AsyncSession, product_id: int, updates: schemas.ProductUpdate, user_id: Optional[int] = None) -> Optional[models.Product]:
    # load product with relationships
    stmt = select(models.Product).where(models.Product.id == product_id)
    if user_id is not None:
        stmt = stmt.where(models.Product.user_id == user_id)
    stmt = stmt.options(
        selectinload(models.Product.supplier),
        selectinload(models.Product.category),
    )
    result = await db.execute(stmt)
    db_product = result.scalars().first()
    if not db_product:
        return None
    updated_items = updates.model_dump(exclude_unset=True)
    # If SKU is being changed/added, ensure uniqueness across other products
    if "sku" in updated_items:
        new_sku = updated_items.get("sku")
        if new_sku:
            stmt = select(models.Product).where(models.Product.sku == new_sku, models.Product.id != product_id)
            result = await db.execute(stmt)
            if result.scalars().first():
                raise ValueError("SKU already exists")
    for k, v in updated_items.items():
        setattr(db_product, k, v)
    db.add(db_product)
    try:
        await db.commit()
        await db.refresh(db_product)
    except IntegrityError as e:
        await db.rollback()
        msg = str(e.orig) if getattr(e, 'orig', None) else str(e)
        if 'sku' in msg.lower():
            raise ValueError("SKU already exists")
        raise ValueError("Database integrity error")
    stmt = select(models.Product).where(models.Product.id == db_product.id).options(
        selectinload(models.Product.supplier),
        selectinload(models.Product.category),
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def delete_product(db: AsyncSession, product_id: int, user_id: Optional[int] = None) -> bool:
    # enforce ownership if user_id provided
    if user_id is None:
        db_product = await db.get(models.Product, product_id)
    else:
        stmt = select(models.Product).where(models.Product.id == product_id, models.Product.user_id == user_id)
        result = await db.execute(stmt)
        db_product = result.scalars().first()
    if not db_product:
        return False
    await db.delete(db_product)
    await db.commit()
    return True
