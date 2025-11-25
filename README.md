# Roast Tracker 2000

A web-based application for managing and analyzing artisan coffee roast logs from Artisan roasting software.

## Features

- **Upload & Parse**: Upload .alog files with optional roast profile images
- **Browse & Search**: View all roasts in a grid with thumbnails
- **Advanced Filtering**: Filter by date range, bean origin, roast level, and full-text search
- **Detailed View**: See complete roast information including:
  - Temperature curves (interactive Chart.js graphs)
  - Phase metrics (dry, mid, finish phases)
  - Rate of rise (ROR) data
  - Defect tracking
  - Roasting and cupping notes
- **Bulk Import**: Import existing .alog files from a directory

## Tech Stack

- **Backend**: Django 5.0 + Django REST Framework
- **Frontend**: React (Vite) + Chart.js
- **Database**: SQLite (development) / PostgreSQL (production ready)

## Project Structure

```
roast_tracker_2000/
├── backend/
│   ├── roasts/              # Main Django app
│   │   ├── models.py        # Roast data model
│   │   ├── parsers.py       # .alog file parser
│   │   ├── serializers.py   # API serializers
│   │   ├── views.py         # API endpoints
│   │   └── management/
│   │       └── commands/
│   │           └── import_roasts.py  # Bulk import command
│   ├── roasttracker/        # Django project settings
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── api.js          # API service
│   │   └── App.jsx         # Main app component
│   └── package.json
└── Roasts/                  # Your roast files
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```

3. Run the Django development server:
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000/api/`

### Frontend Setup

1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Start the React development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173/`

## Bulk Import Existing Roasts

To import your existing .alog files from the Roasts directory:

```bash
cd backend
source venv/bin/activate
python manage.py import_roasts ../Roasts --skip-existing
```

This will:
- Find all .alog files in the directory
- Parse and import them into the database
- Automatically associate matching .jpg images
- Skip duplicates if `--skip-existing` is used

## API Endpoints

- `GET /api/roasts/` - List all roasts (with pagination, search, filters)
- `GET /api/roasts/{id}/` - Get roast details
- `POST /api/roasts/upload/` - Upload new roast (.alog + optional image)
- `DELETE /api/roasts/{id}/` - Delete a roast

### Query Parameters for Filtering

- `search` - Full-text search across title, beans, notes
- `date_from` - Filter by start date (YYYY-MM-DD)
- `date_to` - Filter by end date (YYYY-MM-DD)
- `beans` - Filter by bean name/origin
- `roast_level` - Filter by roast level (light, medium-light, medium, medium-dark, dark)
- `ordering` - Sort by field (e.g., `-roast_date`, `title`, `drop_bt`)

## Database Schema

The `Roast` model includes:
- Basic metadata (title, date, time, operator, organization)
- Equipment info (roaster type, size, heating)
- Bean information (origin, weight in/out, weight loss)
- Temperature points (charge, turning point, dry, first crack, drop)
- Phase metrics (dry, mid, finish phase times and ROR)
- Defect tracking (10 boolean fields)
- Time series data (timex, temp1, temp2 as JSON)
- Notes (roasting and cupping)
- Files (alog file and image)

## Development Notes

- **Database**: Currently using SQLite for easy development. For production on Unraid, update `settings.py` to use PostgreSQL.
- **CORS**: Configured to allow requests from localhost:5173 and localhost:3000
- **Media Files**: Uploaded files are stored in `backend/media/`
- **Admin Interface**: Available at `http://localhost:8000/admin/` (create superuser with `python manage.py createsuperuser`)

## Future Enhancements

- Docker Compose configuration for Unraid deployment
- PostgreSQL production setup
- User authentication
- Comparison view for multiple roasts
- Export functionality (PDF reports, CSV)
- Roast analytics and statistics dashboard

## License

Private project for personal use.
