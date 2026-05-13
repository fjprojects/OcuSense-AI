from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('sw.js', views.service_worker, name='service_worker'),
    path('api/medicines/add/', views.add_medicine, name='add_medicine'),
    path('api/medicines/get/', views.get_medicines, name='get_medicines'),
    path('api/medicines/taken/', views.mark_medicine_taken, name='mark_medicine_taken'),
    path('api/medicines/delete/', views.delete_medicine, name='delete_medicine'),
    path('api/medicines/countdown/', views.update_medicine_countdown, name='update_medicine_countdown'),
]