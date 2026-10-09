from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):
    dependencies = [("eyeapp", "0003_medicinereminder_alarm_time_and_more")]

    operations = [
        migrations.AddField(
            model_name="medicinereminder", name="owner_key",
            field=models.CharField(blank=True, default="", db_index=True, max_length=64),
        ),
        migrations.AddField(
            model_name="medicinereminder", name="timezone_name",
            field=models.CharField(default="UTC", max_length=64),
        ),
        migrations.AddField(
            model_name="medicinereminder", name="paused",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="medicinereminder", name="last_alerted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name="ContactMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100)),
                ("email", models.EmailField(max_length=254)),
                ("message", models.TextField(max_length=5000)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
