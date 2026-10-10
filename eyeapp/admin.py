from django.contrib import admin

from .models import ContactMessage, MedicineReminder


@admin.register(MedicineReminder)
class MedicineReminderAdmin(admin.ModelAdmin):
    list_display = ("medicine_name", "dosage", "status", "active", "paused", "next_reminder_time", "created_at")
    list_filter = ("status", "active", "paused", "repeat")
    search_fields = ("medicine_name", "dosage")
    readonly_fields = ("owner_key", "last_alerted_at", "created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "created_at")
    readonly_fields = ("created_at",)
    search_fields = ("name", "email", "message")
