"""
Django management command to bulk import .alog files from a directory
"""
from django.core.management.base import BaseCommand
from django.core.files import File
from pathlib import Path
import os

from roasts.models import Roast
from roasts.parsers import parse_alog_file


class Command(BaseCommand):
    help = 'Bulk import .alog files from a directory'

    def add_arguments(self, parser):
        parser.add_argument(
            'directory',
            type=str,
            help='Directory containing .alog files to import',
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Skip roasts that already exist (by UUID)',
        )

    def handle(self, *args, **options):
        directory = Path(options['directory'])
        skip_existing = options['skip_existing']

        if not directory.exists() or not directory.is_dir():
            self.stdout.write(
                self.style.ERROR(f'Directory not found: {directory}')
            )
            return

        # Find all .alog files
        alog_files = list(directory.glob('*.alog'))
        self.stdout.write(f'Found {len(alog_files)} .alog files')

        imported = 0
        skipped = 0
        errors = 0

        for alog_path in alog_files:
            try:
                # Parse the .alog file
                parsed_data = parse_alog_file(str(alog_path))

                if not parsed_data:
                    self.stdout.write(
                        self.style.WARNING(f'Failed to parse: {alog_path.name}')
                    )
                    errors += 1
                    continue

                roast_uuid = parsed_data.get('roast_uuid')

                # Check if roast already exists
                if roast_uuid and Roast.objects.filter(roast_uuid=roast_uuid).exists():
                    if skip_existing:
                        self.stdout.write(
                            self.style.WARNING(f'Skipping existing: {alog_path.name}')
                        )
                        skipped += 1
                        continue
                    else:
                        # Update existing roast
                        roast = Roast.objects.get(roast_uuid=roast_uuid)
                        for key, value in parsed_data.items():
                            setattr(roast, key, value)
                else:
                    # Create new roast
                    roast = Roast(**parsed_data)

                # Attach .alog file
                with open(alog_path, 'rb') as f:
                    roast.alog_file.save(alog_path.name, File(f), save=False)

                # Check for matching image file (same name, .jpg extension)
                image_path = alog_path.with_suffix('.jpg')
                if image_path.exists():
                    with open(image_path, 'rb') as f:
                        roast.image_file.save(image_path.name, File(f), save=False)
                    self.stdout.write(f'  - Found image: {image_path.name}')

                roast.save()

                self.stdout.write(
                    self.style.SUCCESS(f'Imported: {alog_path.name} -> {roast.title}')
                )
                imported += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error importing {alog_path.name}: {str(e)}')
                )
                errors += 1

        # Summary
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS(f'Import complete!'))
        self.stdout.write(f'  Imported: {imported}')
        self.stdout.write(f'  Skipped:  {skipped}')
        self.stdout.write(f'  Errors:   {errors}')
