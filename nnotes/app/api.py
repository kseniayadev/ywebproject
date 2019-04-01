import json
import html
import re
from pytz import UTC

from flask import request, jsonify, g

from app import app, auth
from app.models import *
from app.db import db

html_tags_regexp = re.compile('<.*?>')

@app.route('/api/user', methods=['GET', 'POST', 'DELETE'])
@auth.login_required
def userinf():
  user = g.user
  if user is None:
    return jsonify({'result': 'fail'})
  if request.method == 'GET':
    return jsonify({
      'username': user.username,
      'id': user.id,
      'result': 'success'
    })
  elif request.method == 'POST':
    data = json.loads(request.data.decode('utf8'))
    try:
      user.username = data.get('nUsername', user.username)
      user.save()
    except pw.IntegrityError:
      return jsonify({'result': 'fail'})
    if 'oldPassword' in data and 'newPassword' in data:
      if user.check_password(data['oldPassword']):
        user.set_password(data['newPassword'])
      else:
        return jsonify({'result': 'fail', 'description': 'Wrong old password'})
      user.save()
    return jsonify({'result': 'success'})
  elif request.method == 'DELETE':
    for note in user.notes:
      note.delete_instance()
    user.delete_instance()
    return jsonify({'result': 'success'})

@app.route('/api/check')
@auth.login_required
def check():
  if g.get('user') is None:
    return jsonify({'result': 'fail'})
  else:
    return jsonify({'result': 'success'})

@app.route('/api/register', methods=['PUT'])
def register():
  data = json.loads(request.data.decode('utf8'))
  if 'nUsername' in data and 'newPassword' in data:
    if User.get_or_none(User.username == data['nUsername']) is not None:
      return jsonify({'result': 'fail', 'description': 'Username is not free'})
    user = User(username=data['nUsername'])
    user.set_password(data['newPassword'])
    user.save()
    return jsonify({'result': 'success'})
  else:
    return jsonify({'result': 'fail'})

@app.route('/api/note', methods=['GET', 'PUT', 'PATCH', 'POST'])
@auth.login_required
def note():
  user = g.user
  if request.method == 'GET':
    notes = user.notes
    args = request.args
    res = []
    filter_keys = list(map(lambda x: x[4:], filter(lambda x: x.startswith('flr_'), args.keys())))
    for flr in filter_keys:
      if args['flr_' + flr] == '':
        continue
      flr = flr.split('_')
      if flr[1] not in ('id', 'title', 'time', 'favorite', 'category'):
        return jsonify({'result': 'fail', 'description': 'Parameter is not exist'})
      if flr[0] not in ('eq', 'nq', 'lt', 'gt'):
        return jsonify({'result': 'fail', 'description': 'Operation is not exist'})
      if flr[1] == 'title' and flr[0] in ('eq', 'nq'):
        if flr[0] == 'eq':
          if flr[1] == 'title':
            notes = notes.where(Note.title == args.get('flr_eq_title'))
        elif flr[0] == 'nq':
          if flr[1] == 'title':
            notes = notes.where(Note.title != args.get('flr_nq_title'))
      if flr[1] == 'time':
        if flr[0] == 'lt':
          time = args.get('flr_lt_time', '')
          if time == '':
            continue
          time = time.split('|')
          if len(time) != 6:
            return jsonify({'result': 'fail', 'description': 'Wrong argument'})
          time = datetime(
            year=int(time[0]),
            month=int(time[1]),
            day=int(time[2]),
            hour=int(time[3]),
            minute=int(time[4]),
            second=int(time[5]),
            tzinfo=UTC
          )
          notes = notes.where(Note.timestamp < time)
        elif flr[0] == 'gt':
          time = args.get('flr_gt_time', '')
          if time == '':
            continue
          time = time.split('|')
          if len(time) != 6:
            return jsonify({'result': 'fail', 'description': 'Wrong argument'})
          time = datetime(
            year=int(time[0]),
            month=int(time[1]),
            day=int(time[2]),
            hour=int(time[3]),
            minute=int(time[4]),
            second=int(time[5]),
            tzinfo=UTC
          )
          notes = notes.where(Note.timestamp > time)
        else:
          return jsonify({'result': 'fail', 'description': 'Wrong operation'}) 
      if flr[0] == 'eq':
        if flr[1] == 'id':
          notes = notes.where(Note.id == args.get('flr_eq_id'))
        elif flr[1] == 'favorite':
          notes = notes.where(Note.favorite == eval(args.get('flr_eq_favorite')))
        elif flr[1] == 'category':
          notes = notes.where(Note.category == args.get('flr_eq_category'))
      elif flr[0] == 'nq':
        if flr[1] == 'id':
          notes = notes.where(Note.id != args.get('flr_nq_id'))
        elif flr[1] == 'favorite':
          notes = notes.where(Note.favorite != eval(args.get('flr_nq_favorite')))
        elif flr[1] == 'category':
          notes = notes.where(Note.category != args.get('flr_nq_category'))
    
    sort = args.get('sort', '').lower()
    if sort != '':
      if sort not in ('time', 'time_r', 'favorite', 'favorite_r', 'category', 'category_r'):
        return jsonify({'result': 'fail', 'description': 'Parameter is not exist'})
      if sort.endswith('_r'):
        if sort == 'time_r':
          notes = notes.order_by(-Note.timestamp)
        elif sort == 'favorite_r':
          notes = notes.order_by(Note.favorite)
        elif sort == 'category_r':
          notes = notes.order_by(-Note.category)
      else:
        if sort == 'time':
          notes = notes.order_by(Note.timestamp)
        elif sort == 'favorite':
          notes = notes.order_by(-Note.favorite)
        elif sort == 'category':
          notes = notes.order_by(Note.category)
    search = args.get('search', '')
    if search != '':
      reg = []
      for note in notes:
        text = note.text_html
        text =re.sub(html_tags_regexp, '', text)
        if search == search.lower():
          if (re.search(search.lower(), text.lower()) is not None) or (re.search(search.lower(), note.title.lower()) is not None):
            reg.append(note)
        else:
          if (re.search(search, text) is not None) or (re.search(search, note.title) is not None):
            reg.append(note)
      notes = reg
    for note in notes:
      note.calc()
      res.append({
        'title': note.title,
        'text': html.unescape(note.text_html),
        'markdown': html.unescape(note.text_markdown),
        'timestamp': str(note.timestamp),
        'favorite': note.favorite,
        'category': note.category,
        'id': note.id
      })
    return jsonify({'data': res, 'result': 'success', 'size': len(res)})
  elif request.method == 'POST':
    data = json.loads(request.data.decode('utf8'))
    if 'id' not in data:
      return jsonify({'result': 'fail', 'description': 'ID not found'})
    note = Note.get_or_none(Note.id == data['id'])
    if note is None:
      return jsonify({'result': 'fail', 'description': 'Note not found'})
    if note.owner != user:
      return jsonify({'result': 'fail'})
    if 'nTitle' in data:
      note.title = html.escape(data['nTitle'])
    if 'nText' in data:
      note.text_markdown = html.escape(data['nText'])
      note.calc()
    if 'nCategory' in data:
      note.category = data['nCategory']
    if 'nFavorite' in data:
      note.favorite = data['nFavorite']
    note.save()
    return jsonify({'result': 'success'})
  elif request.method == 'PUT':
    data = json.loads(request.data.decode('utf8'))
    if not all((field in data) for field in ('nTitle', 'nText', 'nCategory')):
      return jsonify({'result': 'fail', 'description': 'Not all field in request'})
    with db.atomic():
      note = Note(
        title=html.escape(data['nTitle']),
        text_markdown=html.escape(data['nText']),
        favorite=bool(data.get('nFavorite', False)),
        category=int(data['nCategory']),
        owner=user
      )
      note.calc()
      note.save()
    return jsonify({'result': 'success'})
  elif request.method == 'PATCH': # DELETE
    data = json.loads(request.data.decode('utf8'))
    if 'id' not in data:
      return jsonify({'result': 'fail'})
    note = Note.get_or_none(Note.id == data['id'])
    if note is None:
      return jsonify({'result': 'fail', 'description': 'Note not found'})
    if note.owner != user:
      return jsonify({'result': 'fail'})
    note.delete_instance()
    return jsonify({'result': 'success'})

@app.route('/api/note/share', methods=['POST'])
@auth.login_required
def share():
  user = g.user
  data = json.loads(request.data.decode('utf8'))
  if 'id' not in data:
    return jsonify({'result': 'fail', 'description': 'ID not found'})
  note = Note.get_or_none(Note.id == data['id'])
  if note is None or note.owner != user:
    return jsonify({'result': 'fail'})
  sharednote = ShareNote.from_note(note)
  sharednote.save()
  return jsonify({'result': 'success', 'url': '/note/{}'.format(sharednote.id)})

@app.route('/api/note/categories')
def categories():
  res = {'result': 'success'}
  res['data'] = {t.name: t.value for t in NoteCategory}
  res['keys'] = [t.name for t in NoteCategory]
  return jsonify(res)

@app.route('/api/utils/markdown', methods=['POST'])
def mark():
  data = json.loads(request.data.decode('utf8'))
  if 'target' in data and isinstance(data['target'], str):
    return jsonify({'result': 'success', 'data': markdown.markdown(data['target'])})
  else:
    return jsonify({'result': 'fail'})