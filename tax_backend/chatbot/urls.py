from django.urls import path # type: ignore
from . import views

app_name = 'chatbot'

urlpatterns = [
    path('chat/', views.chat, name='chat'),
    path('documents/', views.list_documents, name='list_documents'),
]