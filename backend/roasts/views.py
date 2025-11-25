"""
Views for the Roast API
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from django.core.files.base import ContentFile
import os

from .models import Roast
from .serializers import RoastListSerializer, RoastDetailSerializer, RoastUploadSerializer
from .parsers import parse_alog_content


class RoastViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Roast model
    Provides list, create, retrieve, update, destroy actions
    """
    queryset = Roast.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'beans', 'operator', 'roasting_notes', 'cupping_notes']
    ordering_fields = ['roast_date', 'roast_time', 'title', 'beans', 'drop_bt']
    ordering = ['-roast_date', '-roast_time']

    def get_serializer_class(self):
        """Use different serializers for list and detail views"""
        if self.action == 'list':
            return RoastListSerializer
        return RoastDetailSerializer

    def get_queryset(self):
        """
        Filter queryset based on query parameters
        """
        queryset = super().get_queryset()

        # Date range filtering
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)

        if date_from:
            queryset = queryset.filter(roast_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(roast_date__lte=date_to)

        # Bean name filtering
        beans = self.request.query_params.get('beans', None)
        if beans:
            queryset = queryset.filter(beans__icontains=beans)

        # Roast level filtering (by drop_bt temperature)
        roast_level = self.request.query_params.get('roast_level', None)
        if roast_level:
            level_ranges = {
                'light': (0, 196),
                'medium-light': (196, 205),
                'medium': (205, 213),
                'medium-dark': (213, 221),
                'dark': (221, 300),
            }
            if roast_level.lower() in level_ranges:
                min_temp, max_temp = level_ranges[roast_level.lower()]
                queryset = queryset.filter(drop_bt__gte=min_temp, drop_bt__lt=max_temp)

        return queryset

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload(self, request):
        """
        Upload and parse multiple .alog files
        Accepts: alog_files[] - array of .alog files
        Returns: Array of results with success/error status for each file
        """
        alog_files = request.FILES.getlist('alog_files')

        if not alog_files:
            return Response(
                {'error': 'No .alog files provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        results = []

        for alog_file in alog_files:
            result = {
                'filename': alog_file.name,
                'status': 'processing'
            }

            # Validate file extension
            if not alog_file.name.endswith('.alog'):
                result['status'] = 'error'
                result['error'] = 'File must be a .alog file'
                results.append(result)
                continue

            # Read and parse .alog file
            try:
                alog_content = alog_file.read().decode('utf-8')
                parsed_data = parse_alog_content(alog_content)

                if not parsed_data:
                    result['status'] = 'error'
                    result['error'] = 'Failed to parse .alog file'
                    results.append(result)
                    continue

                # Check if roast with this UUID already exists
                roast_uuid = parsed_data.get('roast_uuid')
                if roast_uuid and Roast.objects.filter(roast_uuid=roast_uuid).exists():
                    result['status'] = 'skipped'
                    result['error'] = f'Roast with UUID {roast_uuid} already exists'
                    results.append(result)
                    continue

                # Create Roast instance
                roast = Roast(**parsed_data)

                # Save .alog file
                alog_file.seek(0)  # Reset file pointer
                roast.alog_file.save(alog_file.name, ContentFile(alog_file.read()), save=False)

                roast.save()

                # Return created roast data
                result['status'] = 'success'
                result['roast_id'] = str(roast.id)
                result['title'] = roast.title
                result['roast_date'] = str(roast.roast_date)
                results.append(result)

            except Exception as e:
                result['status'] = 'error'
                result['error'] = f'Error processing file: {str(e)}'
                results.append(result)

        # Determine overall response status
        success_count = sum(1 for r in results if r['status'] == 'success')
        error_count = sum(1 for r in results if r['status'] == 'error')
        skipped_count = sum(1 for r in results if r['status'] == 'skipped')

        response_data = {
            'results': results,
            'summary': {
                'total': len(results),
                'success': success_count,
                'error': error_count,
                'skipped': skipped_count
            }
        }

        # Return 207 Multi-Status if we have mixed results, 201 if all success, 400 if all failed
        if success_count == len(results):
            response_status = status.HTTP_201_CREATED
        elif success_count == 0:
            response_status = status.HTTP_400_BAD_REQUEST
        else:
            response_status = status.HTTP_207_MULTI_STATUS

        return Response(response_data, status=response_status)
