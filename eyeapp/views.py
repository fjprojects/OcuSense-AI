from datetime import timedelta
import json
import logging
from pathlib import Path
import secrets

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db.models import F, Q
from django.http import FileResponse, Http404, JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .models import ContactMessage, MedicineReminder, alarm_datetime

logger = logging.getLogger(__name__)


def _body(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValueError("Send a valid JSON object") from None
    if not isinstance(data, dict):
        raise ValueError("Send a valid JSON object")
    return data


def _text(data, field, maximum, required=False):
    value = data.get(field, "")
    if not isinstance(value, str):
        raise ValueError(f"{field} must be text")
    value = value.strip()
    if required and not value:
        raise ValueError(f"{field} is required")
    if len(value) > maximum:
        raise ValueError(f"{field} must be at most {maximum} characters")
    return value


def _boolean(data, field, default=False):
    value = data.get(field, default)
    if not isinstance(value, bool):
        raise ValueError(f"{field} must be true or false")
    return value


def _owner(request, create=False):
    key = request.session.get("medicine_owner")
    if not key and create:
        key = secrets.token_hex(32)
        request.session["medicine_owner"] = key
    return key


def _medicines(request):
    key = _owner(request)
    # Old unowned rows stay available to authenticated administrators, never guests.
    return MedicineReminder.objects.filter(owner_key=key, active=True) if key else MedicineReminder.objects.none()


def _medicine(request, data):
    medicine_id = data.get("medicine_id")
    if not isinstance(medicine_id, int) or isinstance(medicine_id, bool) or medicine_id < 1:
        raise ValueError("medicine_id must be a positive integer")
    return get_object_or_404(_medicines(request), id=medicine_id)


def _serialize(medicine):
    return {
        "id": medicine.id,
        "medicine_name": medicine.medicine_name,
        "dosage": medicine.dosage,
        "alarm_time": medicine.alarm_time,
        "timezone_name": medicine.timezone_name,
        "repeat": medicine.repeat,
        "interval_minutes": medicine.interval_minutes,
        "countdown_seconds": max(0, int((medicine.next_reminder_time - timezone.now()).total_seconds())),
        "total_seconds": medicine.total_seconds,
        "status": medicine.status,
        "active": medicine.active,
        "paused": medicine.paused,
        "last_alerted_at": medicine.last_alerted_at.isoformat() if medicine.last_alerted_at else None,
        "next_reminder_time": medicine.next_reminder_time.isoformat(),
        "created_at": medicine.created_at.isoformat(),
    }


@never_cache
@ensure_csrf_cookie
@require_http_methods(["GET"])
def csrf_token(request):
    _owner(request, create=True)
    return JsonResponse({"csrfToken": get_token(request)})


@never_cache
@require_http_methods(["GET"])
def get_medicines(request):
    return JsonResponse({"medicines": [_serialize(m) for m in _medicines(request)]})


@never_cache
@csrf_protect
@require_http_methods(["POST"])
def add_medicine(request):
    try:
        data = _body(request)
        name = _text(data, "medicine_name", 100, required=True)
        dosage = _text(data, "dosage", 100)
        alarm_time = _text(data, "alarm_time", 10)
        alarm_date = _text(data, "alarm_date", 10)
        zone = _text(data, "timezone_name", 64) or "UTC"
        repeat = _boolean(data, "repeat")
        interval = data.get("interval_minutes", 0)
        if not isinstance(interval, int) or isinstance(interval, bool) or not 0 <= interval <= 525600:
            raise ValueError("interval_minutes must be a whole number between 0 and 525600")
        if alarm_time:
            scheduled = alarm_datetime(alarm_time, alarm_date, zone)
        elif interval:
            if alarm_date:
                raise ValueError("An alarm date requires an alarm time")
            scheduled = timezone.now() + timedelta(minutes=interval)
        else:
            raise ValueError("Provide an alarm time or interval minutes")
        seconds = max(0, int((scheduled - timezone.now()).total_seconds()))
        medicine = MedicineReminder.objects.create(
            owner_key=_owner(request, create=True), medicine_name=name, dosage=dosage,
            alarm_time=alarm_time, timezone_name=zone, repeat=repeat,
            interval_minutes=interval, next_reminder_time=scheduled,
            countdown_seconds=seconds, total_seconds=seconds,
        )
        return JsonResponse(_serialize(medicine), status=201)
    except (ValueError, TypeError) as error:
        return JsonResponse({"error": str(error)}, status=400)



@never_cache
@csrf_protect
@require_http_methods(["POST"])
def mark_medicine_taken(request):
    try:
        medicine = _medicine(request, _body(request))
        medicine.mark_taken()
        return JsonResponse(_serialize(medicine))
    except (ValueError, TypeError) as error:
        return JsonResponse({"error": str(error)}, status=400)


@never_cache
@csrf_protect
@require_http_methods(["POST"])
def delete_medicine(request):
    try:
        medicine = _medicine(request, _body(request))
        medicine.active = False
        medicine.save(update_fields=["active", "updated_at"])
        return JsonResponse({"id": medicine.id, "deleted": True})
    except (ValueError, TypeError) as error:
        return JsonResponse({"error": str(error)}, status=400)


@never_cache
@csrf_protect
@require_http_methods(["POST"])
def update_medicine(request):
    try:
        data = _body(request)
        medicine = _medicine(request, data)
        medicine.paused = _boolean(data, "paused")
        medicine.save(update_fields=["paused", "updated_at"])
        return JsonResponse(_serialize(medicine))
    except (ValueError, TypeError) as error:
        return JsonResponse({"error": str(error)}, status=400)


@never_cache
@csrf_protect
@require_http_methods(["POST"])
def notify_medicine(request):
    """Atomically claim a due occurrence so two tabs do not duplicate its alert."""
    try:
        data = _body(request)
        medicine = _medicine(request, data)
        expected = data.get("next_reminder_time")
        if not isinstance(expected, str):
            raise ValueError("next_reminder_time is required")
        expected = parse_datetime(expected)
        if expected is None or timezone.is_naive(expected):
            raise ValueError("Use an ISO date and time including its time zone")
        now = timezone.now()
        claimed = _medicines(request).filter(
            id=medicine.id, paused=False, status="Pending", next_reminder_time=expected,
            next_reminder_time__lte=now,
        ).filter(
            Q(last_alerted_at__isnull=True) | Q(last_alerted_at__lt=F("next_reminder_time"))
        ).update(last_alerted_at=now)
        medicine.refresh_from_db()
        return JsonResponse({"notify": bool(claimed), "medicine": _serialize(medicine)})
    except (ValueError, TypeError) as error:
        return JsonResponse({"error": str(error)}, status=400)


@never_cache
@csrf_protect
@require_http_methods(["POST"])
def update_medicine_countdown(request):
    """Keep the legacy endpoint, but derive remaining time on the server."""
    try:
        data = _body(request)
        medicine = _medicine(request, data)
        status = data.get("status", "Pending")
        if status not in dict(MedicineReminder.STATUS_CHOICES):
            raise ValueError("Choose a valid reminder status")
        if status == "Taken":
            medicine.mark_taken()
        elif status == "Missed":
            if medicine.next_reminder_time > timezone.now():
                raise ValueError("A future reminder cannot be marked missed")
            medicine.mark_missed()
        return JsonResponse(_serialize(medicine))
    except (ValueError, TypeError) as error:
        return JsonResponse({"error": str(error)}, status=400)


@never_cache
@csrf_protect
@require_http_methods(["POST"])
def contact_api(request):
    try:
        data = _body(request)
        name = _text(data, "name", 100, required=True)
        email = _text(data, "email", 254, required=True)
        message = _text(data, "message", 5000, required=True)
        validate_email(email)
        ContactMessage.objects.create(name=name, email=email, message=message)
        logger.info("Contact submission saved")
        return JsonResponse({"status": "success", "message": "Message received successfully."}, status=201)
    except ValidationError:
        return JsonResponse({"error": "Please enter a valid email address"}, status=400)
    except (ValueError, TypeError) as error:
        return JsonResponse({"error": str(error)}, status=400)


def service_worker(request):
    response = FileResponse(open(Path(settings.BASE_DIR) / "static" / "sw.js", "rb"), content_type="application/javascript")
    response["Cache-Control"] = "no-cache"
    return response


def frontend_asset(request, filename):
    # Only known public files may be served; never accept arbitrary filesystem paths.
    if filename not in {"icon.svg", "manifest.json", "robots.txt", "favicon.ico", "logo192.png", "logo512.png"}:
        raise Http404
    path = Path(settings.BASE_DIR) / "frontend" / "build" / filename
    if not path.is_file():
        raise Http404
    return FileResponse(open(path, "rb"))


def api_not_found(request):
    return JsonResponse({"error": "API endpoint not found"}, status=404)


def health(request):
    return JsonResponse({"status": "ok"})


# Retained template views for compatibility with existing local integrations.
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
            message = "⚠️ Warning: More than 5 hours of screen use. Take a long break and rest your eyes."
        elif screen_time_value > 40:
            message = "Your eyes need rest! Follow the 20-20-20 rule."
        else:
            message = "Screen time is safe."

    return render(request, "home.html", {"message": message, "active_page": "home"})


def screen_health(request):
    return render(request, "screen_health.html", {"active_page": "screen_health"})


def camera_monitoring(request):
    return render(request, "camera_monitoring.html", {"active_page": "camera_monitoring"})


def medicine_reminder(request):
    return render(request, "medicine_reminder.html", {"reminders": _medicines(request), "active_page": "medicine_reminder"})


def about(request):
    return render(request, "about.html", {"active_page": "about"})


def contact(request):
    return render(request, "contact.html", {"active_page": "contact"})
