from django.db import models

from apps.catalogue.models import Product


class Enquiry(models.Model):
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    message = models.TextField()
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="enquiries",
    )
    is_handled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "enquiries"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        target = self.product.name if self.product else "general"
        return f"Enquiry from {self.name} ({target})"
