from pydantic import BaseModel, Field
from typing import Optional, List
import datetime


class SupplierBase(BaseModel):
    name: str = Field(..., max_length=255)
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierOut(SupplierBase):
    id: int
    user_id: Optional[int] = None

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str = Field(..., max_length=255)
    sku: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    price: int
    quantity: int = 0
    low_stock_threshold: int = 0
    supplier_id: Optional[int] = None
    user_id: Optional[int] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    price: Optional[int] = None
    quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    supplier_id: Optional[int] = None


class ProductOut(ProductBase):
    id: int
    last_updated: Optional[datetime.datetime] = None
    supplier: Optional[SupplierOut] = None
    user_id: Optional[int] = None

    class Config:
        from_attributes = True


class ProductCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProductCategoryCreate(ProductCategoryBase):
    pass


class ProductCategoryOut(ProductCategoryBase):
    id: int
    user_id: Optional[int] = None

    class Config:
        from_attributes = True


class ProductSaleBase(BaseModel):
    product_id: int
    user_id: Optional[int] = None
    quantity: int
    sale_price: float


class ProductSaleCreate(ProductSaleBase):
    pass


class ProductSaleOut(ProductSaleBase):
    id: int
    sale_date: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    full_name: str
    email: str


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: int
    is_verified: bool = False

    class Config:
        from_attributes = True


class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: str
    password: str


class VerifyRequest(BaseModel):
    email: str


class VerifyResponse(BaseModel):
    status: str
    detail: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    sub: Optional[str] = None


 
 
 
