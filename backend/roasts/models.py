from django.db import models
import uuid


class Roast(models.Model):
    """Model representing a coffee roast with all associated data from Artisan logs"""

    # Primary identification
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    roast_uuid = models.CharField(max_length=255, unique=True, db_index=True)

    # Basic metadata
    title = models.CharField(max_length=255, db_index=True)
    roast_date = models.DateField(db_index=True)
    roast_time = models.TimeField()
    roast_epoch = models.BigIntegerField()

    # People and equipment
    operator = models.CharField(max_length=255, blank=True)
    organization = models.CharField(max_length=255, blank=True)
    roaster_type = models.CharField(max_length=255, blank=True)
    roaster_size = models.FloatField(null=True, blank=True)
    roaster_heating = models.IntegerField(null=True, blank=True)

    # Bean information
    beans = models.CharField(max_length=500, blank=True, db_index=True)
    weight_in = models.FloatField(null=True, blank=True)
    weight_out = models.FloatField(null=True, blank=True)
    weight_unit = models.CharField(max_length=10, default='g')
    weight_loss = models.FloatField(null=True, blank=True)

    # Key temperature points (in Celsius)
    charge_bt = models.FloatField(null=True, blank=True)
    charge_et = models.FloatField(null=True, blank=True)

    tp_time = models.FloatField(null=True, blank=True, help_text="Turning point time in seconds")
    tp_bt = models.FloatField(null=True, blank=True)
    tp_et = models.FloatField(null=True, blank=True)

    dry_time = models.FloatField(null=True, blank=True)
    dry_bt = models.FloatField(null=True, blank=True)
    dry_et = models.FloatField(null=True, blank=True)

    fcs_time = models.FloatField(null=True, blank=True, help_text="First crack start time in seconds")
    fcs_bt = models.FloatField(null=True, blank=True)
    fcs_et = models.FloatField(null=True, blank=True)
    fcs_ror = models.FloatField(null=True, blank=True)

    drop_time = models.FloatField(null=True, blank=True)
    drop_bt = models.FloatField(null=True, blank=True)
    drop_et = models.FloatField(null=True, blank=True)

    # Phase timings
    total_time = models.FloatField(null=True, blank=True)
    dry_phase_time = models.FloatField(null=True, blank=True)
    mid_phase_time = models.FloatField(null=True, blank=True)
    finish_phase_time = models.FloatField(null=True, blank=True)

    # Rate of rise (ROR) metrics
    dry_phase_ror = models.FloatField(null=True, blank=True)
    mid_phase_ror = models.FloatField(null=True, blank=True)
    finish_phase_ror = models.FloatField(null=True, blank=True)
    total_ror = models.FloatField(null=True, blank=True)

    # Temperature deltas
    dry_phase_delta_temp = models.FloatField(null=True, blank=True)
    mid_phase_delta_temp = models.FloatField(null=True, blank=True)
    finish_phase_delta_temp = models.FloatField(null=True, blank=True)

    # Color measurements
    whole_color = models.FloatField(null=True, blank=True)
    ground_color = models.FloatField(null=True, blank=True)
    color_system = models.CharField(max_length=50, blank=True)

    # Defects (boolean fields)
    heavy_fc = models.BooleanField(default=False)
    low_fc = models.BooleanField(default=False)
    light_cut = models.BooleanField(default=False)
    dark_cut = models.BooleanField(default=False)
    drops = models.BooleanField(default=False)
    oily = models.BooleanField(default=False)
    uneven = models.BooleanField(default=False)
    tipping = models.BooleanField(default=False)
    scorching = models.BooleanField(default=False)
    divots = models.BooleanField(default=False)

    # Notes
    roasting_notes = models.TextField(blank=True)
    cupping_notes = models.TextField(blank=True)

    # Files
    alog_file = models.FileField(upload_to='alogs/', null=True, blank=True)
    image_file = models.ImageField(upload_to='roast_images/', null=True, blank=True)

    # Time series data (stored as JSON)
    timex = models.JSONField(default=list, blank=True)
    temp1 = models.JSONField(default=list, blank=True)
    temp2 = models.JSONField(default=list, blank=True)

    # Raw data backup (entire parsed .alog content)
    raw_data = models.JSONField(default=dict, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-roast_date', '-roast_time']
        indexes = [
            models.Index(fields=['-roast_date', '-roast_time']),
            models.Index(fields=['title']),
            models.Index(fields=['beans']),
        ]

    def __str__(self):
        return f"{self.title} - {self.roast_date}"

    def get_roast_level(self):
        """Determine roast level based on drop temperature"""
        if self.drop_bt is None:
            return "Unknown"

        # Temperature ranges in Celsius
        if self.drop_bt < 196:
            return "Light"
        elif self.drop_bt < 205:
            return "Medium-Light"
        elif self.drop_bt < 213:
            return "Medium"
        elif self.drop_bt < 221:
            return "Medium-Dark"
        else:
            return "Dark"
