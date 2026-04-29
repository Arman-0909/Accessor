import os
import sys

# Add the parent directory to sys.path so we can import 'app'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import engine
from sqlmodel import SQLModel
from app.models import User, APIKey, UsageLog

print("Dropping tables...")
SQLModel.metadata.drop_all(engine)
print("Creating tables...")
SQLModel.metadata.create_all(engine)
print("Done!")
