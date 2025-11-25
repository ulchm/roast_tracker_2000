# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Roast Tracker 2000 is a full-stack web application for managing and analyzing artisan coffee roast logs from Artisan roasting software. It parses `.alog` files (Python dictionary literals), stores comprehensive roast data, and provides visualization of temperature curves and roast metrics.

**Tech Stack:**
- Backend: Django 5.0 + Django REST Framework (JWT auth with djangorestframework-simplejwt)
- Frontend: React (Vite) + Chart.js for interactive temperature graphs
- Database: SQLite (dev) / PostgreSQL (production-ready)

## Development Commands

### Backend

```bash
# Navigate to backend and activate venv
cd backend
source venv/bin/activate

# Run development server
python manage.py runserver

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser for admin
python manage.py createsuperuser

# Bulk import existing .alog files
python manage.py import_roasts ../Roasts --skip-existing

# Create default user (custom management command)
python manage.py create_default_user
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

### Quick Start Scripts

```bash
# From project root
./start-backend.sh   # Activates venv and runs Django server
./start-frontend.sh  # Runs Vite dev server
```

## Architecture

### Data Flow: .alog Parsing

The core workflow centers on parsing Artisan `.alog` files:

1. **Upload/Import** → `.alog` files are uploaded via REST API or bulk imported via management command
2. **Parser** (`backend/roasts/parsers.py`) → Uses `ast.literal_eval()` to safely parse Python dict literals
3. **Extraction** → `extract_roast_data()` maps `.alog` fields to Django model fields:
   - Computed metrics (temperature points, ROR, phase timings) from `data['computed']`
   - Time series data (`timex`, `temp1`, `temp2`) stored as JSON
   - Raw `.alog` data preserved in `raw_data` JSONField
4. **Storage** → `Roast` model (backend/roasts/models.py) with ~70 fields covering all roast aspects
5. **API** → ViewSet provides filtered/searchable endpoints with list/detail serializers
6. **Frontend** → React components render roast grid, detail views with Chart.js temperature curves

### Key Components

**Backend:**
- `roasts/models.py` - Single `Roast` model with comprehensive fields (temperatures, phases, ROR, defects, notes, time series JSON)
- `roasts/parsers.py` - `.alog` parsing logic (`parse_alog_file`, `parse_alog_content`, `extract_roast_data`)
- `roasts/views.py` - `RoastViewSet` with custom filtering (date range, beans, roast level) and `/upload/` endpoint
- `roasts/serializers.py` - Separate list/detail serializers (list excludes heavy time series data)
- `roasts/management/commands/import_roasts.py` - Bulk import command with auto-image detection (.jpg matching .alog name)

**Frontend:**
- `src/api.js` - Axios instance with JWT auth interceptors (auto-refresh on 401)
- `src/components/RoastList.jsx` - Grid view with thumbnails
- `src/components/RoastDetail.jsx` - Full roast details page
- `src/components/RoastChart.jsx` - Chart.js temperature curve visualization
- `src/components/SearchFilters.jsx` - Advanced filtering UI
- `src/components/Upload.jsx` - File upload component
- `src/components/Login.jsx` - JWT authentication

### Database Schema

The `Roast` model uses `roast_uuid` (from .alog) as unique identifier with indexes on:
- `roast_date`, `roast_time` (default ordering: newest first)
- `title`, `beans` (for filtering)

Key field categories:
- **Temperature Points**: charge, turning point (tp), dry end, first crack start (fcs), drop
- **Phases**: dry/mid/finish phase times, ROR, and temperature deltas
- **Files**: `alog_file`, `image_file` (media uploads)
- **Time Series**: `timex`, `temp1`, `temp2` stored as JSONField for Chart.js
- **Raw Backup**: Full parsed .alog in `raw_data` JSONField

### API Patterns

**Authentication**: JWT tokens via djangorestframework-simplejwt
- Frontend stores `access_token` and `refresh_token` in localStorage
- Axios interceptor automatically refreshes expired tokens

**Filtering**: Query params on `/api/roasts/`:
- `search` - Full-text across title, beans, notes
- `date_from`, `date_to` - Date range
- `beans` - Bean origin filter
- `roast_level` - Maps to drop_bt temperature ranges (light: <196°C, medium: 205-213°C, etc.)
- `ordering` - Sort by field (e.g., `-roast_date`, `drop_bt`)

**Upload Endpoint**: `/api/roasts/upload/` (POST multipart/form-data)
- Accepts `.alog` file + optional image
- Parses .alog, checks for UUID conflicts (409 if exists)
- Returns created roast with detail serializer

## Testing .alog Files

Sample roast files are stored in the `Roasts/` directory at project root. These contain real roast data and can be used for testing imports/uploads.

## Database Notes

- Default: SQLite at `backend/db.sqlite3`
- For production (Unraid deployment): Configure PostgreSQL in `settings.py` (psycopg2-binary already in requirements)
- CORS configured for `localhost:5173` and `localhost:3000`
- Media files stored in `backend/media/` (alogs/, roast_images/)

## Admin Interface

Django admin available at `http://localhost:8000/admin/` - provides full CRUD on Roast model with all fields visible.
