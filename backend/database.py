import aiosqlite
import json
from config import settings

async def init_db():
    async with aiosqlite.connect(settings.sqlite_db_path) as db:
        await db.execute('''
            CREATE TABLE IF NOT EXISTS snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL NOT NULL,
                data TEXT NOT NULL
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL NOT NULL,
                type TEXT NOT NULL,
                details TEXT NOT NULL
            )
        ''')
        await db.commit()

async def save_snapshot(timestamp: float, data: dict):
    async with aiosqlite.connect(settings.sqlite_db_path) as db:
        await db.execute(
            'INSERT INTO snapshots (timestamp, data) VALUES (?, ?)',
            (timestamp, json.dumps(data))
        )
        await db.commit()

async def save_alert(timestamp: float, alert_type: str, details: dict):
    async with aiosqlite.connect(settings.sqlite_db_path) as db:
        await db.execute(
            'INSERT INTO alerts (timestamp, type, details) VALUES (?, ?, ?)',
            (timestamp, alert_type, json.dumps(details))
        )
        await db.commit()
