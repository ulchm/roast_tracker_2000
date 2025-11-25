FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy application code
COPY . .

# Create persistent storage directories
RUN mkdir -p /app/data /app/media/alogs /app/media/roast_images

# Set environment variables for persistent storage paths
ENV DATA_DIR=/app/data
ENV MEDIA_ROOT=/app/media

# Collect static files
RUN python manage.py collectstatic --noinput

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8000

# Use entrypoint to run migrations on startup
ENTRYPOINT ["/app/docker-entrypoint.sh"]
