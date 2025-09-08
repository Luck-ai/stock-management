from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from .. import models, schemas
from ..database import get_db
from sqlalchemy import select

router = APIRouter(prefix="/sales", tags=["sales"])


@router.post("/", response_model=schemas.ProductSaleOut)
async def record_sale(sale: schemas.ProductSaleCreate, db: AsyncSession = Depends(get_db)):
    # simple sale recording and product quantity adjustment
    product = await db.get(models.Product, sale.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.quantity < sale.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    product.quantity = product.quantity - sale.quantity
    db_sale = models.ProductSale(**sale.dict())
    db.add(db_sale)
    await db.commit()
    await db.refresh(db_sale)
    return db_sale


@router.get("/", response_model=List[schemas.ProductSaleOut])
async def list_sales(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.ProductSale))
    return result.scalars().all()
