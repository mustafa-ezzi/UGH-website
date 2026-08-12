from django.db import models

from apps.catalogue.validators import validate_image_file


class SiteSetting(models.Model):
    """Singleton site-wide copy, contact, and homepage curation."""

    site_name = models.CharField(max_length=120, default="UGH Appliances")
    tagline = models.CharField(
        max_length=200,
        default="Precision born from heat.",
        blank=True,
    )
    hero_supporting_text = models.CharField(
        max_length=300,
        default="Stoves, chimneys, ovens, and basins — crafted for kitchens that mean something.",
        blank=True,
    )
    about_blurb = models.TextField(blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=40, blank=True)
    whatsapp = models.CharField(max_length=40, blank=True)
    address = models.TextField(blank=True)
    social_instagram = models.URLField(blank=True)
    social_facebook = models.URLField(blank=True)
    social_youtube = models.URLField(blank=True)
    hero_image = models.ImageField(
        upload_to="site/",
        blank=True,
        null=True,
        validators=[validate_image_file],
    )

    # Homepage curation
    homepage_quote = models.CharField(
        max_length=240,
        blank=True,
        default="Everything is designed. Few things are designed well.",
        help_text="Shown on the fixed kitchen quote band.",
    )
    featured_section_title = models.CharField(
        max_length=160,
        blank=True,
        default="Explore a great range of products",
    )
    featured_section_eyebrow = models.CharField(
        max_length=120,
        blank=True,
        default="Unique products only in UGH",
    )
    show_featured_section = models.BooleanField(
        default=True,
        help_text="Toggle the featured products block on the homepage.",
    )
    show_category_ribbon = models.BooleanField(
        default=True,
        help_text="Toggle the shop-by-category ribbon on the homepage.",
    )
    notify_enquiries_to = models.EmailField(
        blank=True,
        help_text="New catalogue enquiries are emailed here (leave blank to skip).",
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Site settings"
        verbose_name_plural = "Site settings"

    def __str__(self) -> str:
        return self.site_name

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls) -> "SiteSetting":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class HomepageSlide(models.Model):
    """Full-bleed homepage carousel (and matching story) slides."""

    image = models.ImageField(
        upload_to="carousel/",
        validators=[validate_image_file],
    )
    eyebrow = models.CharField(max_length=80, blank=True, default="Just newly arrived")
    title = models.CharField(max_length=160)
    body = models.TextField(blank=True)
    cta = models.CharField(max_length=80, blank=True, default="Discover more")
    href = models.CharField(
        max_length=200,
        blank=True,
        default="/catalogue",
        help_text="Storefront path, e.g. /catalogue/ovens or /about",
    )
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Homepage carousel slide"
        verbose_name_plural = "Homepage carousel slides"

    def __str__(self) -> str:
        return self.title or f"Slide {self.pk}"
