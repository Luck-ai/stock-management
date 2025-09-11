from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from .. import models, schemas
from ..database import get_db
from ..security import get_current_user
from sqlalchemy import select

router = APIRouter(prefix="/sales", tags=["sales"])


@router.post("/", response_model=schemas.ProductSaleOut)
async def record_sale(
    sale: schemas.ProductSaleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # simple sale recording and product quantity adjustment
    product = await db.get(models.Product, sale.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.quantity < sale.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    product.quantity = product.quantity - sale.quantity
    sale_data = sale.model_dump()
    sale_data['user_id'] = current_user.id
    db_sale = models.ProductSale(**sale_data)
    db.add(db_sale)
    await db.commit()
    await db.refresh(db_sale)
    return db_sale


@router.get("/", response_model=List[schemas.ProductSaleOut])
async def list_sales(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    stmt = select(models.ProductSale).where(models.ProductSale.user_id == current_user.id)
    result = await db.execute(stmt)
    return result.scalars().all()
