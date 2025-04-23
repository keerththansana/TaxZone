# tax_calculator/urls.py

from django.urls import path # type: ignore
from . import views

VALID_TAX_TYPES = ['employment', 'business', 'rental', 'foreign', 'dividend', 'interest', 'royalty', 'pension', 'capital_gains']

urlpatterns = [
    path('calculate/', views.calculate_tax, name='calculate_tax'),
    path('upload-document/', views.upload_document, name='upload_document'),
    path('documents/', views.list_documents, name='list_documents'),
]