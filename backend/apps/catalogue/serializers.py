from rest_framework import serializers

from apps.catalogue.models import Brand, Category, Product, ProductImage
from apps.core.media import absolute_media_url
from apps.core.models import SiteSetting
from apps.enquiries.models import Enquiry


class BrandSerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()

    class Meta:
        model = Brand
        fields = (
            "id",
            "name",
            "slug",
            "logo",
            "description",
            "sort_order",
        )

    def get_logo(self, obj):
        if not obj.logo:
            return None
        return absolute_media_url(obj.logo.url, self.context.get("request"))


class CategorySerializer(serializers.ModelSerializer):
    parent_slug = serializers.CharField(source="parent.slug", read_only=True, default=None)
    hero_image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "parent",
            "parent_slug",
            "hero_image",
            "description",
            "sort_order",
        )

    def get_hero_image(self, obj):
        if not obj.hero_image:
            return None
        return absolute_media_url(obj.hero_image.url, self.context.get("request"))


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ("id", "image", "alt_text", "sort_order")

    def get_image(self, obj):
        if not obj.image:
            return None
        return absolute_media_url(obj.image.url, self.context.get("request"))


class ProductListSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "brand",
            "categories",
            "sku",
            "price",
            "currency",
            "short_description",
            "is_featured",
            "primary_image",
            "sort_order",
        )

    def get_primary_image(self, obj):
        image = obj.images.order_by("sort_order", "id").first()
        if not image or not image.image:
            return None
        url = absolute_media_url(image.image.url, self.context.get("request"))
        return {"id": image.id, "url": url, "alt_text": image.alt_text}


class ProductDetailSerializer(ProductListSerializer):
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + (
            "long_description",
            "specs",
            "images",
            "created_at",
            "updated_at",
        )


class EnquiryCreateSerializer(serializers.ModelSerializer):
    product_slug = serializers.SlugField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Enquiry
        fields = (
            "id",
            "name",
            "phone",
            "email",
            "message",
            "product",
            "product_slug",
            "created_at",
        )
        read_only_fields = ("id", "product", "created_at")

    def validate(self, attrs):
        email = attrs.get("email", "")
        phone = attrs.get("phone", "")
        if not email and not phone:
            raise serializers.ValidationError(
                "Provide at least an email or phone number so we can reach you."
            )
        return attrs

    def create(self, validated_data):
        product_slug = validated_data.pop("product_slug", "").strip()
        product = None
        if product_slug:
            product = Product.objects.filter(
                slug=product_slug,
                is_published=True,
            ).first()
        return Enquiry.objects.create(product=product, **validated_data)


class SiteSettingSerializer(serializers.ModelSerializer):
    hero_image = serializers.SerializerMethodField()

    class Meta:
        model = SiteSetting
        fields = (
            "site_name",
            "tagline",
            "hero_supporting_text",
            "about_blurb",
            "contact_email",
            "contact_phone",
            "whatsapp",
            "address",
            "social_instagram",
            "social_facebook",
            "social_youtube",
            "hero_image",
            "homepage_quote",
            "featured_section_title",
            "featured_section_eyebrow",
            "show_featured_section",
            "show_category_ribbon",
        )

    def get_hero_image(self, obj):
        if not obj.hero_image:
            return None
        return absolute_media_url(obj.hero_image.url, self.context.get("request"))
