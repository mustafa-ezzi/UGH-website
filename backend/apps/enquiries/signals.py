from django.conf import settings
from django.core.mail import send_mail
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.core.models import SiteSetting
from apps.enquiries.models import Enquiry


@receiver(post_save, sender=Enquiry)
def notify_staff_of_enquiry(sender, instance: Enquiry, created: bool, **kwargs):
    if not created:
        return

    site = SiteSetting.load()
    recipient = (site.notify_enquiries_to or site.contact_email or "").strip()
    if not recipient:
        return

    product_line = (
        f"Product: {instance.product.name} ({instance.product.slug})"
        if instance.product_id
        else "Product: (general enquiry)"
    )
    subject = f"[UGH Appliances] New enquiry from {instance.name}"
    body = (
        f"Name: {instance.name}\n"
        f"Email: {instance.email or '—'}\n"
        f"Phone: {instance.phone or '—'}\n"
        f"{product_line}\n\n"
        f"Message:\n{instance.message}\n\n"
        f"Received: {instance.created_at}\n"
    )

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@ugh-appliances.local")
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=[recipient],
            fail_silently=True,
        )
    except Exception:
        # Never break enquiry creation if mail misconfigured
        pass
