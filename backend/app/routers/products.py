from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/products", tags=["products"])


@router.post("/product", response_model=schemas.ProductOut)
async def create_product(product: schemas.ProductCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_product(db, product)


@router.get("/product", response_model=List[schemas.ProductOut])
async def list_products(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await crud.get_products(db, skip=skip, limit=limit)


@router.get("/product/{product_id}", response_model=schemas.ProductOut)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    p = await crud.get_product(db, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


@router.put("/product/{product_id}", response_model=schemas.ProductOut)
async def update_product(product_id: int, updates: schemas.ProductUpdate, db: AsyncSession = Depends(get_db)):
    p = await crud.update_product(db, product_id, updates)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


@router.delete("/product/{product_id}")
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    ok = await crud.delete_product(db, product_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}
