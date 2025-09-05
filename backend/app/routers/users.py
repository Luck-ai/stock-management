from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from .. import models, schemas
from ..database import get_db
import hashlib

router = APIRouter(prefix="/users", tags=["users"])


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


@router.post("/users", response_model=schemas.UserOut)
async def create_user(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    hashed = _hash_password(user.password)
    db_user = models.User(full_name=user.full_name, email=user.email, password_hash=hashed)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


@router.get("/users", response_model=List[schemas.UserOut])
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(models.User.__table__.select())
    return result.scalars().all()
