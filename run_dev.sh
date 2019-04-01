#!/bin/bash

source venv/bin/activate
cd nnotes
export FLASK_APP=nnotes.py
export FLASK_DEBUG=1
export LC_ALL=C.UTF-8
export LANG=C.UTF-8

flask run --host=0.0.0.0