import html

from flask import render_template, abort

from app import app
from app.models import ShareNote, NoteCategory

@app.route('/')
def index():
  return render_template('base.html')

@app.route('/note/<int:id>')
def share_note(id):
  note = ShareNote.get_or_none(ShareNote.id == id)
  if note is None:
    abort(404)
  return render_template('note.html', title=html.unescape(note.title), category=NoteCategory(note.category).name, t=str(note.timestamp) + 'Z', text=html.unescape(note.text))

@app.errorhandler(404)
def error404(e):
  return render_template('404.html')

@app.errorhandler(500)
def error500(e):
  return render_template('500.html')