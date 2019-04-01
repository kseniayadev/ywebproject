from app.models import *

db.connect()

db.create_tables([User, Note, ShareNote])

db.close()

print('End creating tables')