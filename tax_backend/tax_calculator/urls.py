# tax_calculator/urls.py

from django.urls import path # type: ignore
from . import views

VALID_TAX_TYPES = ['employment', 'business', 'rental', 'foreign', 'dividend']

urlpatterns = [
    path('calculator/calculate/', views.calculate_tax, name='calculate_tax'),
]