from django.urls import path, re_path
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import TemplateView

from . import views

urlpatterns = [
    path("api/csrf/", views.csrf_token, name="csrf_token"),
    path("api/medicines/add/", views.add_medicine, name="add_medicine"),
    path("api/medicines/get/", views.get_medicines, name="get_medicines"),
    path("api/medicines/taken/", views.mark_medicine_taken, name="mark_medicine_taken"),
    path("api/medicines/delete/", views.delete_medicine, name="delete_medicine"),
    path("api/medicines/update/", views.update_medicine, name="update_medicine"),
    path("api/medicines/notify/", views.notify_medicine, name="notify_medicine"),
    path("api/medicines/countdown/", views.update_medicine_countdown, name="update_medicine_countdown"),
    path("api/contact/", views.contact_api, name="contact_api"),
    re_path(r"^api/", views.api_not_found),
    path("health/", views.health, name="health"),
    path("sw.js", views.service_worker, name="service_worker"),
    re_path(r"^(?P<filename>icon\.svg|manifest\.json|robots\.txt|favicon\.ico|logo192\.png|logo512\.png)$", views.frontend_asset),
    re_path(r"^.*$", ensure_csrf_cookie(TemplateView.as_view(template_name="index.html"))),
]
