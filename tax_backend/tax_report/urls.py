from django.urls import path
from . import views

urlpatterns = [
    path('upload-document/', views.upload_tax_form_document, name='upload_tax_form_document'),
    path('session-documents/', views.get_session_documents, name='get_session_documents'),
    path('remove-document/<str:doc_id>/', views.remove_session_document, name='remove_session_document'),
    path('view-document/<str:doc_id>/', views.view_document, name='view_document'),
    # Update these analysis endpoints
    path('analyze-document/<str:doc_id>/', views.analyze_document, name='analyze-document'),
    path('analyze-uploaded-document/', views.analyze_uploaded_document, name='analyze-uploaded-document'),
    path('cleanup-session/', views.cleanup_tax_session, name='cleanup-session'),
]