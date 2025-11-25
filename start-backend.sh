#!/bin/bash
# Start Django backend server

cd backend
source venv/bin/activate
python manage.py runserver
