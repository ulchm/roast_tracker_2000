"""
URL configuration for roasts app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoastViewSet

router = DefaultRouter()
router.register(r'roasts', RoastViewSet, basename='roast')

urlpatterns = [
    path('', include(router.urls)),
]
