from django.contrib import admin

from .models import MedicineReminder


@admin.register(MedicineReminder)
class MedicineReminderAdmin(admin.ModelAdmin):
    list_display = ('medicine_name', 'dosage', 'interval_minutes', 'status', 'active', 'next_reminder_time', 'created_at')
    list_filter = ('status', 'active', 'repeat')
    search_fields = ('medicine_name', 'dosage')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
