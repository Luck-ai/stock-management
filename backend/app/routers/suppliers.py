from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from .. import models, schemas
from ..database import get_db
from .. import crud
from ..security import get_current_user
from .. import models

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.post("/", response_model=schemas.SupplierOut)
async def create_supplier(supplier: schemas.SupplierCreate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    data = supplier.model_dump()
    data['user_id'] = current_user.id
    db_supplier = models.Supplier(**data)
    db.add(db_supplier)
    await db.commit()
    await db.refresh(db_supplier)
    return db_supplier


@router.get("/", response_model=List[schemas.SupplierOut])
async def list_suppliers(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.Supplier).where(models.Supplier.user_id == current_user.id))
    return result.scalars().all()


@router.get("/{supplier_id}", response_model=schemas.SupplierOut)
async def get_supplier(supplier_id: int, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    s = await db.get(models.Supplier, supplier_id)
    if not s or s.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return s
