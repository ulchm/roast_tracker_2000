#!/bin/bash
set -e

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Create default user if it doesn't exist
echo "Ensuring default user exists..."
python manage.py create_default_user

# Start gunicorn
echo "Starting gunicorn..."
exec gunicorn --bind 0.0.0.0:8000 --workers 2 roasttracker.wsgi:application
