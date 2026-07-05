from django.urls import path, re_path
from django.views.generic import TemplateView
from . import views

urlpatterns = [
    # API endpoints (keep these)
    path('api/medicines/add/', views.add_medicine, name='add_medicine'),
    path('api/medicines/get/', views.get_medicines, name='get_medicines'),
    path('api/medicines/taken/', views.mark_medicine_taken, name='mark_medicine_taken'),
    path('api/medicines/delete/', views.delete_medicine, name='delete_medicine'),
    path('api/medicines/countdown/', views.update_medicine_countdown, name='update_medicine_countdown'),
    path('api/contact/', views.contact_api, name='contact_api'),
    
    # Service Worker
    path('sw.js', views.service_worker, name='service_worker'),
    
    # REACT handles ALL frontend routes (including /contact)
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]