import json
from datetime import datetime, timedelta, timezone as dt_timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import Client, TestCase, override_settings
from django.utils import timezone
from .models import ContactMessage, MedicineReminder


@override_settings(ALLOWED_HOSTS=["testserver"])
class ReminderApiTests(TestCase):
    def setUp(self):
        self.owner = Client(enforce_csrf_checks=True)
        self.other = Client(enforce_csrf_checks=True)
        self.token = self.owner.get("/api/csrf/").json()["csrfToken"]
        self.other_token = self.other.get("/api/csrf/").json()["csrfToken"]

    def post(self, endpoint, data, client=None, token=None):
        return (client or self.owner).post(endpoint, json.dumps(data),
            content_type="application/json", HTTP_X_CSRFTOKEN=token or self.token)

    def add(self, **extra):
        response = self.post("/api/medicines/add/", {
            "medicine_name": "Test reminder", "interval_minutes": 15, **extra})
        self.assertEqual(response.status_code, 201, response.content)
        return response.json()

    def test_saved_reminders_persist_and_owner_is_private(self):
        saved = self.add()
        response = self.owner.get("/api/medicines/get/")
        self.assertEqual(response.json()["medicines"][0]["id"], saved["id"])
        self.assertNotIn("owner_key", response.content.decode())
        self.assertIn("no-store", response.headers["Cache-Control"])

    def test_other_browser_cannot_read_or_modify(self):
        saved = self.add()
        self.assertEqual(self.other.get("/api/medicines/get/").json()["medicines"], [])
        for action in ["taken", "delete", "update", "countdown", "notify"]:
            with self.subTest(action=action):
                response = self.post(f"/api/medicines/{action}/", {
                    "medicine_id": saved["id"], "paused": True,
                    "next_reminder_time": saved["next_reminder_time"]},
                    self.other, self.other_token)
                self.assertEqual(response.status_code, 404)
        self.assertTrue(MedicineReminder.objects.get(id=saved["id"]).active)

    def test_no_session_and_unowned_legacy_rows_are_not_exposed(self):
        self.add()
        MedicineReminder.objects.create(medicine_name="Legacy fixture")
        self.assertEqual(Client().get("/api/medicines/get/").json()["medicines"], [])
        self.assertEqual(len(self.owner.get("/api/medicines/get/").json()["medicines"]), 1)

    def test_every_mutation_requires_csrf(self):
        saved = self.add()
        for path in [f"/api/medicines/{action}/" for action in
                     ["add", "taken", "delete", "update", "countdown", "notify"]] + ["/api/contact/"]:
            with self.subTest(path=path):
                response = self.owner.post(path, json.dumps({"medicine_id": saved["id"]}),
                    content_type="application/json")
                self.assertEqual(response.status_code, 403)

    def test_local_daily_schedule_advances_past_acknowledged_occurrence(self):
        with patch("django.utils.timezone.now",
                   return_value=datetime(2026, 9, 30, 2, 30, tzinfo=dt_timezone.utc)):
            saved = self.add(interval_minutes=0, alarm_time="08:30",
                repeat=True, timezone_name="Asia/Kolkata")
            reminder = MedicineReminder.objects.get(id=saved["id"])
            self.assertEqual(reminder.next_reminder_time,
                datetime(2026, 9, 30, 3, 0, tzinfo=dt_timezone.utc))
            self.post("/api/medicines/taken/", {"medicine_id": reminder.id})
            reminder.refresh_from_db()
            self.assertEqual(reminder.next_reminder_time,
                datetime(2026, 10, 1, 3, 0, tzinfo=dt_timezone.utc))

    def test_taken_once_and_delete_remove_active_entries(self):
        first, second = self.add(), self.add()
        self.assertEqual(self.post("/api/medicines/taken/",
            {"medicine_id": first["id"]}).status_code, 200)
        self.assertEqual(self.post("/api/medicines/delete/",
            {"medicine_id": second["id"]}).status_code, 200)
        self.assertEqual(self.owner.get("/api/medicines/get/").json()["medicines"], [])
        self.assertEqual(MedicineReminder.objects.count(), 2)

    def test_pause_and_single_due_alert_claim(self):
        saved = self.add()
        reminder = MedicineReminder.objects.get(id=saved["id"])
        reminder.next_reminder_time = timezone.now() - timedelta(minutes=1)
        reminder.save()
        data = {"medicine_id": reminder.id, "next_reminder_time": reminder.next_reminder_time.isoformat()}
        self.post("/api/medicines/update/", {"medicine_id": reminder.id, "paused": True})
        self.assertTrue(self.owner.get("/api/medicines/get/").json()["medicines"][0]["paused"])
        self.assertFalse(self.post("/api/medicines/notify/", data).json()["notify"])
        self.post("/api/medicines/update/", {"medicine_id": reminder.id, "paused": False})
        self.assertTrue(self.post("/api/medicines/notify/", data).json()["notify"])
        self.assertFalse(self.post("/api/medicines/notify/", data).json()["notify"])

    def test_future_and_stale_occurrences_are_not_claimed(self):
        saved = self.add()
        data = {"medicine_id": saved["id"], "next_reminder_time": saved["next_reminder_time"]}
        self.assertFalse(self.post("/api/medicines/notify/", data).json()["notify"])
        data["next_reminder_time"] = (timezone.now() - timedelta(minutes=1)).isoformat()
        self.assertFalse(self.post("/api/medicines/notify/", data).json()["notify"])

    def test_invalid_fields_and_json_are_rejected(self):
        for data in [
            {"medicine_name": "x", "interval_minutes": -1},
            {"medicine_name": "x", "interval_minutes": "15"},
            {"medicine_name": "x", "alarm_time": "26:30"},
            {"medicine_name": "x", "alarm_time": "12:30", "timezone_name": "not-a-zone"},
            {"medicine_name": "x", "interval_minutes": 1, "repeat": "false"},
            {"medicine_name": "x" * 101, "interval_minutes": 1},
            {"medicine_name": None, "interval_minutes": 1}, []]:
            with self.subTest(data=data):
                self.assertEqual(self.post("/api/medicines/add/", data).status_code, 400)
        response = self.owner.post("/api/medicines/add/", "{", content_type="application/json",
            HTTP_X_CSRFTOKEN=self.token)
        self.assertEqual(response.status_code, 400)

    def test_countdown_is_authoritative(self):
        saved = self.add()
        reminder = MedicineReminder.objects.get(id=saved["id"])
        original = reminder.next_reminder_time
        response = self.post("/api/medicines/countdown/", {
            "medicine_id": reminder.id, "countdown_seconds": 999999, "status": "Pending"})
        reminder.refresh_from_db()
        self.assertEqual(reminder.next_reminder_time, original)
        self.assertLessEqual(response.json()["countdown_seconds"], 15 * 60)

    def test_contact_records_never_go_to_plaintext_files_or_pii_logs(self):
        with TemporaryDirectory() as directory:
            with override_settings(BASE_DIR=Path(directory)), self.assertLogs("eyeapp.views", level="INFO") as captured:
                response = self.post("/api/contact/", {"name": "Review fixture",
                    "email": "fixture@example.com", "message": "Private test message"})
            self.assertFalse((Path(directory) / "contact_logs").exists())
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ContactMessage.objects.get().message, "Private test message")
        self.assertNotIn("fixture@example.com", " ".join(captured.output))
        self.assertNotIn("Private test message", " ".join(captured.output))

    def test_invalid_contact_email_and_unknown_api(self):
        self.assertEqual(self.post("/api/contact/", {
            "name": "Fixture", "email": "invalid@", "message": "Test"}).status_code, 400)
        self.assertEqual(ContactMessage.objects.count(), 0)
        response = self.owner.get("/api/unknown/")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"error": "API endpoint not found"})

    def test_root_service_worker_health_and_frontend(self):
        response = self.owner.get("/sw.js")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["Content-Type"], "application/javascript")
        self.assertEqual(response.headers["Cache-Control"], "no-cache")
        response.close()
        self.assertEqual(self.owner.get("/health/").json(), {"status": "ok"})
        if (Path(settings.BASE_DIR) / "frontend/build/index.html").exists():
            for path in ["/", "/camera-monitor", "/medicine-reminder", "/screen-health"]:
                self.assertContains(self.owner.get(path), 'id="root"')

    def test_feedback_can_only_be_read_by_authorized_admin(self):
        self.post("/api/contact/", {"name": "Feedback fixture",
            "email": "fixture@example.com", "message": "Private feedback fixture"})
        message = ContactMessage.objects.get()
        detail = f"/admin/eyeapp/contactmessage/{message.id}/change/"
        visitor = Client()
        self.assertEqual(visitor.get(detail).status_code, 302)
        User = get_user_model()
        staff = User.objects.create_user(username="staff-fixture", is_staff=True)
        visitor.force_login(staff)
        self.assertEqual(visitor.get(detail).status_code, 403)
        administrator = User.objects.create_superuser(username="admin-fixture",
            email="admin@example.com", password="Testing-only-password-42")
        visitor.force_login(administrator)
        self.assertContains(visitor.get(detail), "Private feedback fixture")
