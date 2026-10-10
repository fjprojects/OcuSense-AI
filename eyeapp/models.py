from datetime import datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.db import models
from django.utils import timezone


def alarm_datetime(alarm_time, alarm_date="", timezone_name="UTC", reference=None):
    """Interpret a wall-clock time in the browser's IANA time zone."""
    try:
        zone = ZoneInfo(timezone_name)
    except (ZoneInfoNotFoundError, ValueError, TypeError):
        raise ValueError("Choose a valid time zone") from None
    reference = timezone.localtime(reference or timezone.now(), zone)
    value = alarm_time.strip().upper()
    try:
        parsed_time = datetime.strptime(value, "%I:%M %p" if "AM" in value or "PM" in value else "%H:%M").time()
        day = datetime.strptime(alarm_date, "%Y-%m-%d").date() if alarm_date else reference.date()
    except (ValueError, TypeError):
        raise ValueError("Use yyyy-mm-dd for the date and hh:mm or hh:mm AM/PM for the time") from None
    scheduled = datetime.combine(day, parsed_time, tzinfo=zone)
    if scheduled <= reference:
        if alarm_date:
            raise ValueError("Scheduled date and time must be in the future")
        scheduled = datetime.combine(day + timedelta(days=1), parsed_time, tzinfo=zone)
    return scheduled


class MedicineReminder(models.Model):
    STATUS_CHOICES = [("Pending", "Pending"), ("Taken", "Taken"), ("Missed", "Missed")]

    # An opaque token held in a server-side Django session; never returned by the API.
    owner_key = models.CharField(max_length=64, blank=True, default="", db_index=True)
    medicine_name = models.CharField(max_length=100)
    dosage = models.CharField(max_length=100, blank=True, help_text='Optional dosage instructions')
    alarm_time = models.CharField(max_length=10, blank=True, help_text='Alarm time in hh:mm AM/PM format')
    timezone_name = models.CharField(max_length=64, default="UTC")
    interval_minutes = models.PositiveIntegerField(default=0)
    repeat = models.BooleanField(default=True, help_text='Repeat this reminder each day at the alarm time')
    next_reminder_time = models.DateTimeField(default=timezone.now)
    countdown_seconds = models.PositiveIntegerField(default=0)
    total_seconds = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    active = models.BooleanField(default=True)
    paused = models.BooleanField(default=False)
    last_alerted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.medicine_name} ({self.status})"

    @staticmethod
    def parse_alarm_time(alarm_time_str, reference=None):
        return alarm_datetime(alarm_time_str, reference=reference)

    def schedule_next_alarm(self):
        now = timezone.now()
        # Acknowledging an upcoming occurrence must advance beyond that occurrence.
        reference = max(now, self.next_reminder_time or now)
        if self.alarm_time:
            self.next_reminder_time = alarm_datetime(
                self.alarm_time, timezone_name=self.timezone_name, reference=reference
            )
        elif self.interval_minutes:
            self.next_reminder_time = now + timedelta(minutes=self.interval_minutes)
        else:
            return
        self.countdown_seconds = max(0, int((self.next_reminder_time - now).total_seconds()))
        self.total_seconds = self.countdown_seconds
        self.status = "Pending"
        self.active = True
        self.last_alerted_at = None
        self.save(update_fields=[
            "next_reminder_time", "countdown_seconds", "total_seconds", "status",
            "active", "last_alerted_at", "updated_at",
        ])

    def mark_taken(self):
        if self.repeat and (self.alarm_time or self.interval_minutes):
            self.schedule_next_alarm()
        else:
            self.status = "Taken"
            self.active = False
            self.save(update_fields=["status", "active", "updated_at"])

    def mark_missed(self):
        self.status = "Missed"
        self.save(update_fields=["status", "updated_at"])


class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    message = models.TextField(max_length=5000)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Contact message {self.pk}"
