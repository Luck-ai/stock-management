from pydantic import BaseModel, Field
from typing import Optional, List


class SupplierBase(BaseModel):
    name: str = Field(..., max_length=255)
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierOut(SupplierBase):
    id: int

    class Config:
        orm_mode = True


class ProductBase(BaseModel):
    name: str = Field(..., max_length=255)
    sku: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    price: float = 0.0
    quantity: int = 0
    low_stock_threshold: int = 0
    supplier_id: Optional[int] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str]
    sku: Optional[str]
    category: Optional[str]
    description: Optional[str]
    price: Optional[float]
    quantity: Optional[int]
    low_stock_threshold: Optional[int]
    supplier_id: Optional[int]


class ProductOut(ProductBase):
    id: int
    last_updated: Optional[str] = None
    supplier: Optional[SupplierOut] = None

    class Config:
        orm_mode = True


class ProductCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProductCategoryCreate(ProductCategoryBase):
    pass


class ProductCategoryOut(ProductCategoryBase):
    id: int

    class Config:
        orm_mode = True


class ProductSaleBase(BaseModel):
    product_id: int
    user_id: Optional[int] = None
    quantity: int
    sale_price: float


class ProductSaleCreate(ProductSaleBase):
    pass


class ProductSaleOut(ProductSaleBase):
    id: int
    sale_date: Optional[str] = None

    class Config:
        orm_mode = True


class UserBase(BaseModel):
    full_name: str
    email: str


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: int
    role: Optional[str] = None
    is_active: bool = True

    class Config:
        orm_mode = True


 
 
 
