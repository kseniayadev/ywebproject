from app import app
import peewee as pw

db = pw.SqliteDatabase(app.config['DB_PATH'])
