from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_document, name='upload_document'),
    path('documents/', views.get_documents, name='get_documents'),
    path('documents/<str:doc_id>/', views.get_document, name='get_document'),
    path('documents/<str:doc_id>/delete/', views.delete_document, name='delete_document'),
    path('analyze-document/<str:doc_id>/', views.analyze_document, name='analyze_document'),
    path('documents/<str:doc_id>/extract-context/', views.extract_and_map_context, name='extract_and_map_context'),
    path('documents/<str:doc_id>/form-mappings/', views.get_form_field_mappings, name='get_form_field_mappings'),
    path('upload-document/', views.upload_tax_form_document, name='upload_tax_form_document'),
    path('session-documents/', views.get_session_documents, name='get_session_documents'),
    path('remove-document/<str:doc_id>/', views.remove_session_document, name='remove_session_document'),
    path('view-document/<str:doc_id>/', views.view_document, name='view_document'),
    path('analyze-uploaded-document/', views.analyze_uploaded_document, name='analyze-uploaded-document'),
    path('cleanup-session/', views.cleanup_tax_session, name='cleanup-session'),
    path('auto-fill/', views.auto_fill_forms, name='auto_fill_forms'),
    path('api/download/', views.record_download, name='record_download'),
    path('save-document/', views.save_document, name='save_document'),
    path('user-details/<int:user_id>/', views.get_user_details, name='get_user_details'),
    path('test-gemini-analysis/', views.test_gemini_analysis, name='test_gemini_analysis'),
]