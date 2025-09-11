from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from .. import models, schemas
from ..database import get_db
from sqlalchemy import select
from ..security import get_current_user
from .. import models

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post("/", response_model=schemas.ProductCategoryOut)
async def create_category(cat: schemas.ProductCategoryCreate, db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    data = cat.model_dump()
    data['user_id'] = current_user.id
    db_cat = models.ProductCategory(**data)
    db.add(db_cat)
    await db.commit()
    await db.refresh(db_cat)
    return db_cat


@router.get("/", response_model=List[schemas.ProductCategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.ProductCategory).where(models.ProductCategory.user_id == current_user.id))
    return result.scalars().all()
