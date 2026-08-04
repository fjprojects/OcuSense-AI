from datetime import datetime, timedelta
import json
import logging
import os

from django.conf import settings
from django.http import FileResponse, JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework import generics

from .models import ContactMessage, MedicineReminder, MonitoringSession
from .serializers import ContactMessageSerializer, MonitoringSessionSerializer


logger = logging.getLogger(__name__)


# =========================================================
# NORMAL DJANGO PAGES
# =========================================================

def home(request):
    message = ""

    if request.method == "POST":
        screen_time = request.POST.get("time", "")

        try:
            screen_time_value = int(screen_time)
        except ValueError:
            screen_time_value = None

        if screen_time_value is None:
            message = "Please enter a valid number of minutes."

        elif screen_time_value >= 300:
            message = (
                "Warning: More than 5 hours of screen use. "
                "Take a long break and rest your eyes."
            )

        elif screen_time_value > 40:
            message = (
                "Your eyes need rest! Follow the 20-20-20 rule."
            )

        else:
            message = "Screen time is safe."

    return render(
        request,
        "home.html",
        {
            "message": message,
            "active_page": "home",
        },
    )


def screen_health(request):
    return render(
        request,
        "screen_health.html",
        {
            "active_page": "screen_health",
        },
    )


def camera_monitoring(request):
    return render(
        request,
        "camera_monitoring.html",
        {
            "active_page": "camera_monitoring",
        },
    )


def medicine_reminder(request):
    reminders = MedicineReminder.objects.filter(
        active=True
    )

    return render(
        request,
        "medicine_reminder.html",
        {
            "reminders": reminders,
            "active_page": "medicine_reminder",
        },
    )


def about(request):
    return render(
        request,
        "about.html",
        {
            "active_page": "about",
        },
    )


def contact(request):
    return render(
        request,
        "contact.html",
        {
            "active_page": "contact",
        },
    )


# =========================================================
# SERVICE WORKER
# =========================================================

def service_worker(request):
    sw_path = os.path.join(
        settings.BASE_DIR,
        "static",
        "sw.js",
    )

    if os.path.exists(sw_path):
        return FileResponse(
            open(sw_path, "rb"),
            content_type="application/javascript",
        )

    return JsonResponse(
        {
            "error": "Service worker not found",
        },
        status=404,
    )


# =========================================================
# MEDICINE TIME FUNCTIONS
# =========================================================

def parse_alarm_time(alarm_time_str):
    alarm_time_str = alarm_time_str.strip().upper()

    try:
        if "AM" in alarm_time_str or "PM" in alarm_time_str:
            parsed = datetime.strptime(
                alarm_time_str,
                "%I:%M %p",
            )
        else:
            parsed = datetime.strptime(
                alarm_time_str,
                "%H:%M",
            )

    except ValueError:
        raise ValueError(
            "Alarm time must use hh:mm "
            "or hh:mm AM/PM format"
        )

    now = timezone.localtime()

    scheduled = datetime(
        year=now.year,
        month=now.month,
        day=now.day,
        hour=parsed.hour,
        minute=parsed.minute,
    )

    current_timezone = (
        timezone.get_current_timezone()
    )

    scheduled_datetime = timezone.make_aware(
        scheduled,
        current_timezone,
    )

    if scheduled_datetime <= now:
        scheduled_datetime += timedelta(days=1)

    return scheduled_datetime


def parse_alarm_datetime(
    alarm_date_str,
    alarm_time_str,
):
    if not alarm_time_str:
        raise ValueError("Alarm time is required")

    time_string = alarm_time_str.strip()

    date_string = (
        alarm_date_str.strip()
        if alarm_date_str
        else ""
    )

    current_timezone = (
        timezone.get_current_timezone()
    )

    if date_string:
        try:
            date_part = datetime.strptime(
                date_string,
                "%Y-%m-%d",
            ).date()

        except ValueError:
            raise ValueError(
                "Date must use yyyy-mm-dd format"
            )

        try:
            if (
                "AM" in time_string.upper()
                or "PM" in time_string.upper()
            ):
                time_part = datetime.strptime(
                    time_string,
                    "%I:%M %p",
                ).time()
            else:
                time_part = datetime.strptime(
                    time_string,
                    "%H:%M",
                ).time()

        except ValueError:
            raise ValueError(
                "Time must use hh:mm "
                "or hh:mm AM/PM format"
            )

        scheduled = datetime(
            year=date_part.year,
            month=date_part.month,
            day=date_part.day,
            hour=time_part.hour,
            minute=time_part.minute,
        )

        scheduled_datetime = timezone.make_aware(
            scheduled,
            current_timezone,
        )

        if scheduled_datetime <= timezone.localtime():
            raise ValueError(
                "Scheduled date and time "
                "must be in the future"
            )

        return scheduled_datetime

    return parse_alarm_time(time_string)


# =========================================================
# MEDICINE API
# =========================================================

@csrf_exempt
@require_http_methods(["POST"])
def add_medicine(request):
    try:
        data = json.loads(request.body)

        medicine_name = data.get(
            "medicine_name",
            "",
        ).strip()

        dosage = data.get(
            "dosage",
            "",
        ).strip()

        alarm_date = data.get(
            "alarm_date",
            "",
        ).strip()

        alarm_time = data.get(
            "alarm_time",
            "",
        ).strip()

        repeat = bool(
            data.get("repeat", False)
        )

        interval_minutes = int(
            data.get("interval_minutes", 0)
        )

        if not medicine_name:
            return JsonResponse(
                {
                    "error": "Medicine name is required",
                },
                status=400,
            )

        next_reminder_time = timezone.now()
        total_seconds = 0

        if alarm_time:
            next_reminder_time = (
                parse_alarm_datetime(
                    alarm_date,
                    alarm_time,
                )
            )

            total_seconds = int(
                (
                    next_reminder_time
                    - timezone.localtime()
                ).total_seconds()
            )

        elif interval_minutes > 0:
            next_reminder_time = (
                timezone.now()
                + timedelta(
                    minutes=interval_minutes
                )
            )

            total_seconds = (
                interval_minutes * 60
            )

        else:
            return JsonResponse(
                {
                    "error": (
                        "Provide an alarm time "
                        "or interval minutes"
                    ),
                },
                status=400,
            )

        medicine = MedicineReminder.objects.create(
            medicine_name=medicine_name,
            dosage=dosage,
            alarm_time=alarm_time,
            repeat=repeat,
            interval_minutes=interval_minutes,
            countdown_seconds=total_seconds,
            total_seconds=total_seconds,
            status="Pending",
            active=True,
            next_reminder_time=next_reminder_time,
        )

        return JsonResponse(
            {
                "id": medicine.id,
                "medicine_name": (
                    medicine.medicine_name
                ),
                "dosage": medicine.dosage,
                "alarm_time": medicine.alarm_time,
                "repeat": medicine.repeat,
                "interval_minutes": (
                    medicine.interval_minutes
                ),
                "countdown_seconds": (
                    medicine.countdown_seconds
                ),
                "total_seconds": (
                    medicine.total_seconds
                ),
                "status": medicine.status,
                "created_at": (
                    medicine.created_at.isoformat()
                ),
                "next_reminder_time": (
                    medicine
                    .next_reminder_time
                    .isoformat()
                ),
            },
            status=201,
        )

    except json.JSONDecodeError:
        return JsonResponse(
            {
                "error": "Invalid JSON data",
            },
            status=400,
        )

    except Exception as error:
        return JsonResponse(
            {
                "error": str(error),
            },
            status=400,
        )


@require_http_methods(["GET"])
def get_medicines(request):
    medicines = (
        MedicineReminder.objects
        .filter(active=True)
        .order_by("-created_at")
    )

    medicine_list = []

    for medicine in medicines:
        medicine_list.append(
            {
                "id": medicine.id,
                "medicine_name": (
                    medicine.medicine_name
                ),
                "dosage": medicine.dosage,
                "alarm_time": medicine.alarm_time,
                "repeat": medicine.repeat,
                "interval_minutes": (
                    medicine.interval_minutes
                ),
                "countdown_seconds": (
                    medicine.countdown_seconds
                ),
                "total_seconds": (
                    medicine.total_seconds
                ),
                "status": medicine.status,
                "next_reminder_time": (
                    medicine
                    .next_reminder_time
                    .isoformat()
                    if medicine.next_reminder_time
                    else None
                ),
                "created_at": (
                    medicine.created_at.isoformat()
                ),
            }
        )

    return JsonResponse(
        {
            "medicines": medicine_list,
        }
    )


@csrf_exempt
@require_http_methods(["POST"])
def mark_medicine_taken(request):
    try:
        data = json.loads(request.body)

        medicine_id = data.get(
            "medicine_id"
        )

        medicine = MedicineReminder.objects.get(
            id=medicine_id
        )

        medicine.mark_taken()

        return JsonResponse(
            {
                "id": medicine.id,
                "status": medicine.status,
                "countdown_seconds": (
                    medicine.countdown_seconds
                ),
                "next_reminder_time": (
                    medicine
                    .next_reminder_time
                    .isoformat()
                    if medicine.next_reminder_time
                    else None
                ),
            }
        )

    except MedicineReminder.DoesNotExist:
        return JsonResponse(
            {
                "error": "Medicine not found",
            },
            status=404,
        )

    except Exception as error:
        return JsonResponse(
            {
                "error": str(error),
            },
            status=400,
        )


@csrf_exempt
@require_http_methods(["POST"])
def delete_medicine(request):
    try:
        data = json.loads(request.body)

        medicine_id = data.get(
            "medicine_id"
        )

        medicine = MedicineReminder.objects.get(
            id=medicine_id
        )

        medicine.active = False
        medicine.save(
            update_fields=[
                "active",
                "updated_at",
            ]
        )

        return JsonResponse(
            {
                "id": medicine.id,
                "deleted": True,
            }
        )

    except MedicineReminder.DoesNotExist:
        return JsonResponse(
            {
                "error": "Medicine not found",
            },
            status=404,
        )

    except Exception as error:
        return JsonResponse(
            {
                "error": str(error),
            },
            status=400,
        )


@csrf_exempt
@require_http_methods(["POST"])
def update_medicine_countdown(request):
    try:
        data = json.loads(request.body)

        medicine_id = data.get(
            "medicine_id"
        )

        countdown_seconds = int(
            data.get(
                "countdown_seconds",
                0,
            )
        )

        status = data.get(
            "status",
            "Pending",
        )

        medicine = MedicineReminder.objects.get(
            id=medicine_id
        )

        medicine.countdown_seconds = (
            countdown_seconds
        )

        medicine.status = status

        medicine.save(
            update_fields=[
                "countdown_seconds",
                "status",
                "updated_at",
            ]
        )

        return JsonResponse(
            {
                "id": medicine.id,
                "countdown_seconds": (
                    medicine.countdown_seconds
                ),
                "status": medicine.status,
            }
        )

    except MedicineReminder.DoesNotExist:
        return JsonResponse(
            {
                "error": "Medicine not found",
            },
            status=404,
        )

    except Exception as error:
        return JsonResponse(
            {
                "error": str(error),
            },
            status=400,
        )


# =========================================================
# CONTACT API
# Saves to database and text file
# =========================================================

@csrf_exempt
@require_http_methods(["POST"])
def contact_api(request):
    try:
        data = json.loads(request.body)

        name = data.get(
            "name",
            "",
        ).strip()

        email = data.get(
            "email",
            "",
        ).strip()

        message = data.get(
            "message",
            "",
        ).strip()

        if not name:
            return JsonResponse(
                {
                    "status": "error",
                    "message": "Please enter your name",
                },
                status=400,
            )

        if not email:
            return JsonResponse(
                {
                    "status": "error",
                    "message": "Please enter your email",
                },
                status=400,
            )

        if "@" not in email or "." not in email:
            return JsonResponse(
                {
                    "status": "error",
                    "message": (
                        "Please enter a valid "
                        "email address"
                    ),
                },
                status=400,
            )

        if not message:
            return JsonResponse(
                {
                    "status": "error",
                    "message": (
                        "Please enter your message"
                    ),
                },
                status=400,
            )

        # Save to Django database
        contact_message = (
            ContactMessage.objects.create(
                name=name,
                email=email,
                message=message,
            )
        )

        # Save to text file
        

        return JsonResponse(
            {
                "status": "success",
                "message": (
                    "Message sent successfully"
                ),
                "id": contact_message.id,
            },
            status=201,
        )

    except json.JSONDecodeError:
        return JsonResponse(
            {
                "status": "error",
                "message": "Invalid data format",
            },
            status=400,
        )

    except Exception as error:
        logger.exception(
            "Contact form error"
        )

        return JsonResponse(
            {
                "status": "error",
                "message": (
                    "Something went wrong. "
                    "Please try again."
                ),
                "details": str(error),
            },
            status=500,
        )




# =========================================================
# MONITORING SESSION API
# =========================================================

@csrf_exempt
@require_http_methods(["GET", "POST"])
def monitoring_sessions_api(request):
    if request.method == "GET":
        sessions = MonitoringSession.objects.all()[:100]
        serializer = MonitoringSessionSerializer(sessions, many=True)
        return JsonResponse({"sessions": serializer.data})

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON data"}, status=400)

    serializer = MonitoringSessionSerializer(data=data)
    if serializer.is_valid():
        session = serializer.save()
        return JsonResponse(
            MonitoringSessionSerializer(session).data,
            status=201,
        )

    return JsonResponse({"errors": serializer.errors}, status=400)


@csrf_exempt
@require_http_methods(["DELETE"])
def monitoring_session_delete_api(request, session_id):
    try:
        session = MonitoringSession.objects.get(id=session_id)
    except MonitoringSession.DoesNotExist:
        return JsonResponse({"error": "Session not found"}, status=404)

    session.delete()
    return JsonResponse({"deleted": True})


# =========================================================
# REST FRAMEWORK CONTACT VIEW
# =========================================================

class ContactMessageCreateView(
    generics.CreateAPIView
):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer