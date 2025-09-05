from pydantic import BaseModel, Field
from typing import Optional


class ProductBase(BaseModel):
    name: str = Field(..., max_length=255)
    sku: Optional[str] = None
    description: Optional[str] = None
    price: float = 0.0
    quantity: int = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str]
    sku: Optional[str]
    description: Optional[str]
    price: Optional[float]
    quantity: Optional[int]


class ProductOut(ProductBase):
    id: int

    class Config:
        orm_mode = True
