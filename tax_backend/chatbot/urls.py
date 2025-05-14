from django.urls import path # type: ignore
from . import views

app_name = 'chatbot'

urlpatterns = [
    path('chat', views.chat, name='chat'),  # Remove trailing slash
    path('test_chat/', views.test_chat, name='test_chat'),
    path('upload', views.upload_document, name='upload_document'),
    path('test-gemini/', views.test_gemini, name='test_gemini'),
    path('debug-gemini/', views.debug_gemini, name='debug_gemini'),
    path('history/', views.get_tax_history, name='tax_history'),
    path('history/<uuid:conversation_id>/', views.get_conversation_history, name='conversation_history'),
    path('history/<uuid:conversation_id>/delete/', views.delete_conversation, name='delete_conversation'),
]