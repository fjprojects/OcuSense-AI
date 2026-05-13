from datetime import datetime, timedelta

import os
import json

from django.conf import settings
from django.http import FileResponse, HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from .models import MedicineReminder

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

    return render(request, "home.html", {"message": message})


def parse_alarm_time(alarm_time_str):
    alarm_time_str = alarm_time_str.strip().upper()
    try:
        parsed = datetime.strptime(alarm_time_str, '%I:%M %p')
    except ValueError:
        raise ValueError('Alarm time must use hh:mm AM/PM format, for example 07:30 PM')

    now = timezone.localtime()
    scheduled = datetime(
        year=now.year,
        month=now.month,
        day=now.day,
        hour=parsed.hour,
        minute=parsed.minute,
    )
    tz = timezone.get_current_timezone()
    scheduled_dt = timezone.make_aware(scheduled, tz)
    if scheduled_dt <= now:
        scheduled_dt += timedelta(days=1)
    return scheduled_dt


@require_http_methods(["POST"])
def add_medicine(request):
    try:
        data = json.loads(request.body)
        medicine_name = data.get('medicine_name', '').strip()
        dosage = data.get('dosage', '').strip()
        alarm_time = data.get('alarm_time', '').strip()
        repeat = bool(data.get('repeat', False))
        interval_minutes = int(data.get('interval_minutes', 0))

        if not medicine_name:
            return JsonResponse({'error': 'Medicine name is required'}, status=400)

        next_reminder_time = timezone.now()
        total_seconds = 0

        if alarm_time:
            next_reminder_time = parse_alarm_time(alarm_time)
            total_seconds = int((next_reminder_time - timezone.localtime()).total_seconds())
        elif interval_minutes > 0:
            next_reminder_time = timezone.now() + timedelta(minutes=interval_minutes)
            total_seconds = interval_minutes * 60
        else:
            return JsonResponse({'error': 'Provide an alarm time or interval minutes'}, status=400)

        medicine = MedicineReminder.objects.create(
            medicine_name=medicine_name,
            dosage=dosage,
            alarm_time=alarm_time,
            repeat=repeat,
            interval_minutes=interval_minutes,
            countdown_seconds=total_seconds,
            total_seconds=total_seconds,
            status='Pending',
            active=True,
            next_reminder_time=next_reminder_time
        )

        return JsonResponse({
            'id': medicine.id,
            'medicine_name': medicine.medicine_name,
            'dosage': medicine.dosage,
            'alarm_time': medicine.alarm_time,
            'repeat': medicine.repeat,
            'interval_minutes': medicine.interval_minutes,
            'countdown_seconds': medicine.countdown_seconds,
            'total_seconds': medicine.total_seconds,
            'status': medicine.status,
            'created_at': medicine.created_at.isoformat(),
            'next_reminder_time': medicine.next_reminder_time.isoformat(),
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_http_methods(["GET"])
def get_medicines(request):
    medicines = MedicineReminder.objects.filter(active=True).order_by('-created_at')
    medicine_list = []
    
    for medicine in medicines:
        medicine_list.append({
            'id': medicine.id,
            'medicine_name': medicine.medicine_name,
            'dosage': medicine.dosage,
            'alarm_time': medicine.alarm_time,
            'repeat': medicine.repeat,
            'interval_minutes': medicine.interval_minutes,
            'countdown_seconds': medicine.countdown_seconds,
            'total_seconds': medicine.total_seconds,
            'status': medicine.status,
            'next_reminder_time': medicine.next_reminder_time.isoformat(),
            'created_at': medicine.created_at.isoformat()
        })
    
    return JsonResponse({'medicines': medicine_list})


@require_http_methods(["POST"])
def mark_medicine_taken(request):
    try:
        data = json.loads(request.body)
        medicine_id = data.get('medicine_id')
        
        medicine = MedicineReminder.objects.get(id=medicine_id)
        medicine.mark_taken()
        
        return JsonResponse({
            'id': medicine.id,
            'status': medicine.status,
            'countdown_seconds': medicine.countdown_seconds,
            'next_reminder_time': medicine.next_reminder_time.isoformat() if medicine.next_reminder_time else None
        })
    except MedicineReminder.DoesNotExist:
        return JsonResponse({'error': 'Medicine not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_http_methods(["POST"])
def delete_medicine(request):
    try:
        data = json.loads(request.body)
        medicine_id = data.get('medicine_id')
        
        medicine = MedicineReminder.objects.get(id=medicine_id)
        medicine.active = False
        medicine.save()
        
        return JsonResponse({'id': medicine.id, 'deleted': True})
    except MedicineReminder.DoesNotExist:
        return JsonResponse({'error': 'Medicine not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_http_methods(["POST"])
def update_medicine_countdown(request):
    try:
        data = json.loads(request.body)
        medicine_id = data.get('medicine_id')
        countdown_seconds = int(data.get('countdown_seconds', 0))
        status = data.get('status', 'Pending')
        
        medicine = MedicineReminder.objects.get(id=medicine_id)
        medicine.countdown_seconds = countdown_seconds
        medicine.status = status
        medicine.save()
        
        return JsonResponse({
            'id': medicine.id,
            'countdown_seconds': medicine.countdown_seconds,
            'status': medicine.status
        })
    except MedicineReminder.DoesNotExist:
        return JsonResponse({'error': 'Medicine not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@require_http_methods(["GET"])
def service_worker(request):
    sw_path = os.path.join(settings.BASE_DIR, 'static', 'sw.js')
    if os.path.exists(sw_path):
        return FileResponse(open(sw_path, 'rb'), content_type='application/javascript')
    return HttpResponse('/* Service worker not found */', content_type='application/javascript', status=404)
