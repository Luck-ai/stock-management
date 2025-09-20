import os
from sqlalchemy import create_engine, MetaData, Table
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+asyncpg://postgres:postgres@localhost:5432/stockdb')
# convert to sync URL
sync = DATABASE_URL.replace('postgresql+asyncpg://','postgresql://')
print('Using:', sync)
engine = create_engine(sync)
meta = MetaData()
try:
    tbl = Table('purchase_orders', meta, autoload_with=engine)
    print('Columns:', [c.name for c in tbl.columns])
except Exception as e:
    print('Error:', e)