from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from .. import models, schemas
from ..database import get_db
import hashlib
import logging
from ..security import create_access_token
from datetime import timedelta

router = APIRouter(prefix="/users", tags=["users"])


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


@router.post("/", response_model=schemas.UserOut)
async def create_user(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    hashed = _hash_password(user.password)
    db_user = models.User(full_name=user.full_name, email=user.email, password_hash=hashed)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


@router.get("/", response_model=List[schemas.UserOut])
async def list_users(db: AsyncSession = Depends(get_db)):
        result = await db.execute(select(models.User))
        users = result.scalars().all()
        return users



@router.post('/login', response_model=schemas.Token)
async def login(data: schemas.UserLogin, db: AsyncSession = Depends(get_db)):
    hashed = _hash_password(data.password)
    result = await db.execute(select(models.User).where(models.User.email == data.email))
    user = result.scalars().first()
    if not user or user.password_hash != hashed:
        raise HTTPException(status_code=401, detail='Invalid credentials')
    # create token with subject = user.id
    access_token_expires = timedelta(minutes=60)
    token = create_access_token(data={"sub": str(user.id)}, expires_delta=access_token_expires)
    return {"access_token": token, "token_type": "bearer"}
