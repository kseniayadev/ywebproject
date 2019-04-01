from flask import Flask
from flask_httpauth import HTTPBasicAuth

from config import Config
#Creating and configurating app
app = Flask(__name__)
app.config.from_object(Config)
#Connecting auth
authobj = HTTPBasicAuth()

#Manage DB
from app.db import db

@app.before_request
def before_request():
  db.connect()

@app.after_request
def after_request(response):
  db.close()
  return response
# Loading routes
from app import routes
from app import api