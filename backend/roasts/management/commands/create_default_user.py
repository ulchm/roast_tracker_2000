"""
Management command to create a default user for initial login
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Creates a default user for initial login'

    def handle(self, *args, **options):
        username = 'admin'
        password = 'roastmaster'
        email = 'admin@roasttracker.local'

        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'User "{username}" already exists')
            )
            return

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        user.is_staff = True
        user.is_superuser = True
        user.save()

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created user "{username}" with password "{password}"'
            )
        )
        self.stdout.write(
            self.style.WARNING(
                'Remember to change this password in production!'
            )
        )
