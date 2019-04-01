#!/bin/bash

source venv/bin/activate
cd nnotes
gunicorn nnotes:app -b 0.0.0.0:5000