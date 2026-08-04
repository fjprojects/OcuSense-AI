from rest_framework import serializers
from .models import ContactMessage, MonitoringSession


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = "__all__"
        read_only_fields = ["created_at"]

class MonitoringSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonitoringSession
        fields = "__all__"
        read_only_fields = ["id", "created_at"]
