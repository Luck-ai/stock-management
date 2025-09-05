from sqlalchemy.orm import Session
from . import models, schemas
from sqlalchemy import select


def get_product(db: Session, product_id: int):
    return db.get(models.Product, product_id)


def get_products(db: Session, skip: int = 0, limit: int = 100):
    stmt = select(models.Product).offset(skip).limit(limit)
    return db.execute(stmt).scalars().all()


def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def update_product(db: Session, product_id: int, updates: schemas.ProductUpdate):
    db_product = db.get(models.Product, product_id)
    if not db_product:
        return None
    for k, v in updates.dict(exclude_unset=True).items():
        setattr(db_product, k, v)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def delete_product(db: Session, product_id: int):
    db_product = db.get(models.Product, product_id)
    if not db_product:
        return False
    db.delete(db_product)
    db.commit()
    return True
