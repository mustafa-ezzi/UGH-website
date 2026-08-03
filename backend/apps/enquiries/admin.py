from django.contrib import admin
from django.utils.html import format_html

from .models import Enquiry


@admin.action(description="Mark selected as handled")
def mark_handled(modeladmin, request, queryset):
    updated = queryset.update(is_handled=True)
    modeladmin.message_user(request, f"Marked {updated} enquiry(ies) as handled.")


@admin.action(description="Mark selected as open")
def mark_open(modeladmin, request, queryset):
    updated = queryset.update(is_handled=False)
    modeladmin.message_user(request, f"Reopened {updated} enquiry(ies).")


@admin.register(Enquiry)
class EnquiryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "email",
        "phone",
        "product_link",
        "is_handled",
        "created_at",
        "message_preview",
    )
    list_filter = ("is_handled", "created_at")
    list_editable = ("is_handled",)
    search_fields = ("name", "email", "phone", "message", "product__name")
    readonly_fields = ("created_at", "name", "email", "phone", "message", "product")
    autocomplete_fields = ("product",)
    actions = [mark_handled, mark_open]
    date_hierarchy = "created_at"
    ordering = ("-created_at",)

    fieldsets = (
        (
            "Enquiry",
            {
                "fields": (
                    "name",
                    "email",
                    "phone",
                    "product",
                    "message",
                    "created_at",
                )
            },
        ),
        ("Status", {"fields": ("is_handled",)}),
    )

    @admin.display(description="Product")
    def product_link(self, obj):
        if not obj.product_id:
            return "—"
        return obj.product.name

    @admin.display(description="Message")
    def message_preview(self, obj):
        text = (obj.message or "")[:80]
        if len(obj.message or "") > 80:
            text += "…"
        return text

    def has_add_permission(self, request):
        # Enquiries come from the public form only
        return False
