from django.contrib import admin

from .models import MedicineReminder, ContactMessage


@admin.register(MedicineReminder)
class MedicineReminderAdmin(admin.ModelAdmin):
    list_display = (
        "medicine_name",
        "dosage",
        "interval_minutes",
        "status",
        "active",
        "next_reminder_time",
        "created_at",
    )
    list_filter = ("status", "active", "repeat")
    search_fields = ("medicine_name", "dosage")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "created_at")
    search_fields = ("name", "email", "message")
    ordering = ("-created_at",)
from .models import MonitoringSession

@admin.register(MonitoringSession)
class MonitoringSessionAdmin(admin.ModelAdmin):
    list_display = (
        "started_at",
        "duration_seconds",
        "total_blinks",
        "average_blink_rate",
        "average_posture_score",
    )
    ordering = ("-started_at",)
