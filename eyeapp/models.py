from datetime import datetime, timedelta

from django.db import models
from django.utils import timezone


class MedicineReminder(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Taken', 'Taken'),
        ('Missed', 'Missed'),
    ]

    medicine_name = models.CharField(max_length=100)
    dosage = models.CharField(max_length=100, blank=True, help_text='Optional dosage instructions')
    alarm_time = models.CharField(max_length=10, blank=True, help_text='Alarm time in hh:mm AM/PM format')
    interval_minutes = models.PositiveIntegerField(default=0)
    repeat = models.BooleanField(default=True, help_text='Repeat this reminder each day at the alarm time')
    next_reminder_time = models.DateTimeField(default=timezone.now)
    countdown_seconds = models.PositiveIntegerField(default=0)
    total_seconds = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.medicine_name} ({self.status})"

    def save(self, *args, **kwargs):
        if self.alarm_time and self.next_reminder_time == timezone.now():
            self.schedule_next_alarm()
        elif not self.countdown_seconds and self.interval_minutes > 0:
            self.countdown_seconds = self.interval_minutes * 60
            self.total_seconds = self.interval_minutes * 60
            if not self.next_reminder_time:
                self.next_reminder_time = timezone.now() + timedelta(minutes=self.interval_minutes)
        if not self.total_seconds and self.countdown_seconds:
            self.total_seconds = self.countdown_seconds
        super().save(*args, **kwargs)

    @staticmethod
    def parse_alarm_time(alarm_time_str, reference=None):
        alarm_time_str = alarm_time_str.strip().upper()
        reference = reference or timezone.localtime()
        try:
            parsed = datetime.strptime(alarm_time_str, '%I:%M %p')
        except ValueError:
            raise ValueError('Alarm time must use hh:mm AM/PM format, for example 07:30 PM')

        scheduled = datetime(
            year=reference.year,
            month=reference.month,
            day=reference.day,
            hour=parsed.hour,
            minute=parsed.minute,
        )
        tz = timezone.get_current_timezone()
        scheduled_dt = timezone.make_aware(scheduled, tz)
        if scheduled_dt <= reference:
            scheduled_dt += timedelta(days=1)
        return scheduled_dt

    def schedule_next_alarm(self):
        if not self.alarm_time:
            return
        now = timezone.localtime()
        next_time = self.parse_alarm_time(self.alarm_time, reference=now)
        self.next_reminder_time = next_time
        self.countdown_seconds = max(0, int((next_time - now).total_seconds()))
        self.total_seconds = self.countdown_seconds
        self.status = 'Pending'
        self.active = True
        self.save(update_fields=['next_reminder_time', 'countdown_seconds', 'total_seconds', 'status', 'active', 'updated_at'])

    def mark_taken(self):
        if self.repeat and self.alarm_time:
            self.schedule_next_alarm()
        else:
            self.status = 'Taken'
            self.active = False
            self.save(update_fields=['status', 'active', 'updated_at'])

    def mark_missed(self):
        self.status = 'Missed'
        self.save(update_fields=['status', 'updated_at'])
