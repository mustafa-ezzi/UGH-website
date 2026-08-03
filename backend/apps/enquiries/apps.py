from django.apps import AppConfig


class EnquiriesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.enquiries"
    label = "enquiries"
    verbose_name = "Enquiries"

    def ready(self):
        from . import signals  # noqa: F401
