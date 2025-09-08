from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base


class Supplier(Base):
    __tablename__ = 'suppliers'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(64), nullable=True)
    address = Column(Text, nullable=True)


class Product(Base):
    __tablename__ = 'products'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    sku = Column(String(64), unique=True, index=True, nullable=True)
    category_id = Column(Integer, ForeignKey('product_categories.id'), nullable=True, index=True)
    description = Column(Text, nullable=True)
    price = Column(Integer, nullable=False, default=0)
    quantity = Column(Integer, nullable=False, default=0)
    low_stock_threshold = Column(Integer, nullable=False, default=0)
    supplier_id = Column(Integer, ForeignKey('suppliers.id'), nullable=True, index=True)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    supplier = relationship('Supplier', backref='products')
    category = relationship('ProductCategory', backref='products')


class ProductCategory(Base):
    __tablename__ = 'product_categories'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)


class ProductSale(Base):
    __tablename__ = 'product_sales'

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    quantity = Column(Integer, nullable=False)
    sale_price = Column(Numeric(12, 2), nullable=False)
    sale_date = Column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())



