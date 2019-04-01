#!/bin/bash
python3 -m pip install virtualenv
virtualenv venv --python=python3
source venv/bin/activate

pip install -r requirements.txt

python3 nnotes/setup.py

mv app.sqlite nnotes