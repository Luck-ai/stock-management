from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from .. import models, schemas
from ..database import get_db
from ..crud import create_product
from .. import crud

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.post("/supply", response_model=schemas.SupplierOut)
async def create_supplier(supplier: schemas.SupplierCreate, db: AsyncSession = Depends(get_db)):
    db_supplier = models.Supplier(**supplier.dict())
    db.add(db_supplier)
    await db.commit()
    await db.refresh(db_supplier)
    return db_supplier


@router.get("/supply", response_model=List[schemas.SupplierOut])
async def list_suppliers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(models.Supplier.__table__.select())
    return result.scalars().all()


@router.get("/supply/{supplier_id}", response_model=schemas.SupplierOut)
async def get_supplier(supplier_id: int, db: AsyncSession = Depends(get_db)):
    s = await db.get(models.Supplier, supplier_id)
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return s
