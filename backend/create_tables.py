#!/usr/bin/env python3
"""Script to create database tables"""

from sqlmodel import SQLModel
from src.config.database import async_engine
import asyncio

async def create_tables():
    print('Creating database tables...')
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    print('Tables created successfully!')

if __name__ == "__main__":
    asyncio.run(create_tables())