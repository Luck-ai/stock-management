from sqlalchemy.ext.asyncio import AsyncSession
from . import models, schemas
from sqlalchemy import select
from typing import List, Optional


async def get_product(db: AsyncSession, product_id: int) -> Optional[models.Product]:
    return await db.get(models.Product, product_id)


async def get_products(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[models.Product]:
    stmt = select(models.Product).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_product(db: AsyncSession, product: schemas.ProductCreate) -> models.Product:
    db_product = models.Product(**product.dict())
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product


async def update_product(db: AsyncSession, product_id: int, updates: schemas.ProductUpdate) -> Optional[models.Product]:
    db_product = await db.get(models.Product, product_id)
    if not db_product:
        return None
    for k, v in updates.dict(exclude_unset=True).items():
        setattr(db_product, k, v)
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product


async def delete_product(db: AsyncSession, product_id: int) -> bool:
    db_product = await db.get(models.Product, product_id)
    if not db_product:
        return False
    await db.delete(db_product)
    await db.commit()
    return True
