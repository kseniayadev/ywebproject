from enum import Enum
from datetime import datetime

import peewee as pw
from werkzeug.security import generate_password_hash, check_password_hash
import markdown

from app.db import db

class NoteCategory(Enum):
  TODO=1
  URL=2
  NOTE=3

class User(pw.Model):
  username = pw.CharField(max_length=64, unique=True)
  password_hash = pw.CharField(max_length=128, null=True)
  def set_password(self, password):
    self.password_hash = generate_password_hash(password)

  def check_password(self, password):
    return check_password_hash(self.password_hash, password)
  
  class Meta:
    database = db
    table_name = 'users'

class Note(pw.Model):
  title = pw.CharField(max_length=64)
  text_html = pw.TextField()
  text_markdown = pw.TextField()
  timestamp = pw.DateTimeField(default=datetime.utcnow)
  favorite = pw.BooleanField()
  category = pw.IntegerField(default=3)
  owner = pw.ForeignKeyField(User, backref='notes')
  def calc(self):
    self.text_html = markdown.markdown(self.text_markdown)
  
  class Meta:
    database = db
    table_name = 'notes'

class ShareNote(pw.Model):
  title = pw.CharField(max_length=64)
  text = pw.TextField()
  timestamp = pw.DateTimeField()
  category = pw.IntegerField(default=3)
  
  @classmethod
  def from_note(cls, note):
    return cls(title=note.title,
               text=note.text_html,
               timestamp=note.timestamp,
               category=note.category)
  class Meta:
    database = db
    table_name = 'shared_notes'