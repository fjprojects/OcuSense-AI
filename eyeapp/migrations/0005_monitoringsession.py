from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("eyeapp", "0004_contactmessage"),
    ]

    operations = [
        migrations.CreateModel(
            name="MonitoringSession",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("duration_seconds", models.PositiveIntegerField(default=0)),
                ("total_blinks", models.PositiveIntegerField(default=0)),
                ("average_blink_rate", models.FloatField(default=0)),
                ("average_posture_score", models.FloatField(default=0)),
                ("distance_warnings", models.PositiveIntegerField(default=0)),
                ("low_blink_warnings", models.PositiveIntegerField(default=0)),
                ("started_at", models.DateTimeField()),
                ("ended_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["-started_at"]},
        ),
    ]
