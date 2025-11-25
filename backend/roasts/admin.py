from django.contrib import admin
from .models import Roast


@admin.register(Roast)
class RoastAdmin(admin.ModelAdmin):
    list_display = ['title', 'roast_date', 'roast_time', 'beans', 'operator', 'drop_bt', 'total_time']
    list_filter = ['roast_date', 'operator', 'heavy_fc', 'low_fc']
    search_fields = ['title', 'beans', 'operator', 'roasting_notes', 'cupping_notes']
    readonly_fields = ['id', 'roast_uuid', 'created_at', 'updated_at']
    date_hierarchy = 'roast_date'

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'roast_uuid', 'title', 'roast_date', 'roast_time', 'roast_epoch')
        }),
        ('People & Equipment', {
            'fields': ('operator', 'organization', 'roaster_type', 'roaster_size', 'roaster_heating')
        }),
        ('Bean Information', {
            'fields': ('beans', 'weight_in', 'weight_out', 'weight_unit', 'weight_loss')
        }),
        ('Temperature Points', {
            'fields': (
                ('charge_bt', 'charge_et'),
                ('tp_time', 'tp_bt', 'tp_et'),
                ('dry_time', 'dry_bt', 'dry_et'),
                ('fcs_time', 'fcs_bt', 'fcs_et', 'fcs_ror'),
                ('drop_time', 'drop_bt', 'drop_et'),
            )
        }),
        ('Phase Metrics', {
            'fields': (
                'total_time',
                ('dry_phase_time', 'mid_phase_time', 'finish_phase_time'),
                ('dry_phase_ror', 'mid_phase_ror', 'finish_phase_ror', 'total_ror'),
                ('dry_phase_delta_temp', 'mid_phase_delta_temp', 'finish_phase_delta_temp'),
            )
        }),
        ('Color & Defects', {
            'fields': (
                ('whole_color', 'ground_color', 'color_system'),
                ('heavy_fc', 'low_fc', 'light_cut', 'dark_cut', 'drops'),
                ('oily', 'uneven', 'tipping', 'scorching', 'divots'),
            )
        }),
        ('Notes', {
            'fields': ('roasting_notes', 'cupping_notes')
        }),
        ('Files', {
            'fields': ('alog_file', 'image_file')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
