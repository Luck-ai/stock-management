from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post("/category", response_model=schemas.ProductCategoryOut)
async def create_category(cat: schemas.ProductCategoryCreate, db: AsyncSession = Depends(get_db)):
    db_cat = models.ProductCategory(**cat.dict())
    db.add(db_cat)
    await db.commit()
    await db.refresh(db_cat)
    return db_cat


@router.get("/category", response_model=List[schemas.ProductCategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(models.ProductCategory.__table__.select())
    return result.scalars().all()
