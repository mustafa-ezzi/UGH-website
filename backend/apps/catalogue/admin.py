from django.contrib import admin
from django.utils.html import format_html
from adminsortable2.admin import SortableAdminMixin, SortableTabularInline

from .models import Brand, Category, Product, ProductImage


@admin.register(Brand)
class BrandAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "sort_order")
    list_editable = ("is_active",)
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)
    ordering = ("sort_order", "name")


@admin.register(Category)
class CategoryAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = ("name", "parent", "slug", "is_active", "sort_order")
    list_editable = ("is_active",)
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)
    list_filter = ("is_active", "parent")
    ordering = ("sort_order", "name")


class ProductImageInline(SortableTabularInline):
    model = ProductImage
    extra = 1
    fields = ("image", "preview", "alt_text", "sort_order")
    readonly_fields = ("preview",)
    ordering = ("sort_order",)

    @admin.display(description="Preview")
    def preview(self, obj):
        if obj.pk and obj.image:
            return format_html(
                '<img src="{}" style="max-height:64px;border-radius:4px;" />',
                obj.image.url,
            )
        return "—"


@admin.action(description="Publish selected products")
def publish_products(modeladmin, request, queryset):
    updated = queryset.update(is_published=True)
    modeladmin.message_user(request, f"Published {updated} product(s).")


@admin.action(description="Unpublish selected products")
def unpublish_products(modeladmin, request, queryset):
    updated = queryset.update(is_published=False)
    modeladmin.message_user(request, f"Unpublished {updated} product(s).")


@admin.action(description="Mark as featured")
def feature_products(modeladmin, request, queryset):
    updated = queryset.update(is_featured=True)
    modeladmin.message_user(request, f"Featured {updated} product(s).")


@admin.action(description="Remove featured flag")
def unfeature_products(modeladmin, request, queryset):
    updated = queryset.update(is_featured=False)
    modeladmin.message_user(request, f"Unfeatured {updated} product(s).")


@admin.register(Product)
class ProductAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = (
        "name",
        "brand",
        "price",
        "currency",
        "is_featured",
        "is_published",
        "sort_order",
    )
    list_editable = ("price", "is_featured", "is_published")
    list_filter = ("is_published", "is_featured", "brand", "categories", "currency")
    search_fields = ("name", "sku", "short_description")
    prepopulated_fields = {"slug": ("name",)}
    filter_horizontal = ("categories",)
    inlines = [ProductImageInline]
    actions = [
        publish_products,
        unpublish_products,
        feature_products,
        unfeature_products,
    ]
    ordering = ("sort_order", "name")
    list_per_page = 40
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "name",
                    "slug",
                    "brand",
                    "categories",
                    "sku",
                )
            },
        ),
        ("Pricing", {"fields": ("price", "currency")}),
        (
            "Content",
            {
                "fields": (
                    "short_description",
                    "long_description",
                    "specs",
                )
            },
        ),
        (
            "Visibility",
            {
                "fields": ("is_featured", "is_published", "sort_order"),
                "description": "Featured products appear on the homepage when the featured section is enabled in Site settings.",
            },
        ),
    )


@admin.register(ProductImage)
class ProductImageAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = ("product", "sort_order", "alt_text", "preview")
    list_filter = ("product",)
    search_fields = ("product__name", "alt_text")
    readonly_fields = ("preview",)
    ordering = ("product", "sort_order")

    @admin.display(description="Preview")
    def preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height:80px;border-radius:4px;" />',
                obj.image.url,
            )
        return "—"
