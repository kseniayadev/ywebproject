from flask import g, jsonify

from app import authobj
from app.models import User

@authobj.verify_password
def verify_password(username, password):
  user = User.get_or_none(User.username == username)
  if user is None:
    return False, 'User not found'
  if user.check_password(password):
    g.user = user
    return True, None
  else:
    g.user = None
    return False, 'Wrong password'

def is_logged():
  return g.user is not None
  
@authobj.error_handler
def error_auth(error):
  return jsonify({'result': 'fail', 'description': error}), 200

login_required = authobj.login_required