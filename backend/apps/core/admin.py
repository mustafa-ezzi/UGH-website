from django.contrib import admin

from .models import SiteSetting


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
