from django.contrib import admin
from django.utils.html import format_html
from adminsortable2.admin import SortableAdminMixin

from .models import HomepageSlide, SiteSetting


@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    fieldsets = (
        (
            "Brand",
            {
                "fields": (
                    "site_name",
                    "tagline",
                    "hero_supporting_text",
                    "hero_image",
                    "about_blurb",
                )
            },
        ),
        (
            "Homepage curation",
            {
                "fields": (
                    "homepage_quote",
                    "featured_section_eyebrow",
                    "featured_section_title",
                    "show_featured_section",
                    "show_category_ribbon",
                ),
                "description": (
                    "Control homepage sections without a deploy. "
                    "Carousel photos are managed under Homepage carousel slides. "
                    "Featured products are chosen per-product via the Featured flag."
                ),
            },
        ),
        (
            "Contact",
            {
                "fields": (
                    "contact_email",
                    "contact_phone",
                    "whatsapp",
                    "address",
                )
            },
        ),
        (
            "Notifications",
            {
                "fields": ("notify_enquiries_to",),
            },
        ),
        (
            "Social",
            {
                "fields": (
                    "social_instagram",
                    "social_facebook",
                    "social_youtube",
                )
            },
        ),
    )

    def has_add_permission(self, request):
        return not SiteSetting.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(HomepageSlide)
class HomepageSlideAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = ("preview", "title", "eyebrow", "href", "is_active", "sort_order")
    list_display_links = ("preview", "title")
    list_editable = ("is_active",)
    list_filter = ("is_active",)
    search_fields = ("title", "eyebrow", "body")
    ordering = ("sort_order", "id")
    readonly_fields = ("preview",)
    fields = (
        "image",
        "preview",
        "eyebrow",
        "title",
        "body",
        "cta",
        "href",
        "is_active",
        "sort_order",
    )

    @admin.display(description="Image")
    def preview(self, obj):
        if obj.pk and obj.image:
            return format_html(
                '<img src="{}" style="max-height:72px;border-radius:4px;" />',
                obj.image.url,
            )
        return "—"
