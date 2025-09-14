from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from .. import crud, schemas
from ..database import get_db
from ..security import get_current_user
from .. import models

router = APIRouter(prefix="/products", tags=["products"])


@router.post("/", response_model=schemas.ProductOut)
async def create_product(product: schemas.ProductCreate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        data = product.model_dump()
        data['user_id'] = current_user.id
        p_schema = schemas.ProductCreate.model_validate(data)
        return await crud.create_product(db, p_schema)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[schemas.ProductOut])
async def list_products(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return await crud.get_products(db, skip=skip, limit=limit, user_id=current_user.id)


@router.get("/{product_id}", response_model=schemas.ProductOut)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    p = await crud.get_product(db, product_id, user_id=current_user.id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


@router.put("/{product_id}", response_model=schemas.ProductOut)
async def update_product(product_id: int, updates: schemas.ProductUpdate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        p = await crud.update_product(db, product_id, updates, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


@router.delete("/{product_id}")
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    ok = await crud.delete_product(db, product_id, user_id=current_user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}
