"""
Serializers for the Roast model
"""
from rest_framework import serializers
from .models import Roast


class RoastListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list view"""
    roast_level = serializers.SerializerMethodField()

    class Meta:
        model = Roast
        fields = [
            'id', 'roast_uuid', 'title', 'roast_date', 'roast_time',
            'beans', 'weight_in', 'operator', 'drop_bt', 'total_time',
            'roast_level', 'image_file', 'created_at'
        ]

    def get_roast_level(self, obj):
        return obj.get_roast_level()


class RoastDetailSerializer(serializers.ModelSerializer):
    """Complete serializer with all fields"""
    roast_level = serializers.SerializerMethodField()

    class Meta:
        model = Roast
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_roast_level(self, obj):
        return obj.get_roast_level()


class RoastUploadSerializer(serializers.Serializer):
    """Serializer for file upload"""
    alog_file = serializers.FileField()
    image_file = serializers.ImageField(required=False, allow_null=True)

    def validate_alog_file(self, value):
        """Validate that the file is an .alog file"""
        if not value.name.endswith('.alog'):
            raise serializers.ValidationError("File must be a .alog file")
        return value

    def validate_image_file(self, value):
        """Validate that the image is a supported format"""
        if value and not value.name.lower().endswith(('.jpg', '.jpeg', '.png')):
            raise serializers.ValidationError("Image must be JPG, JPEG, or PNG")
        return value
