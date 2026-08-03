from rest_framework import serializers

from apps.catalogue.models import Brand, Category, Product, ProductImage
from apps.core.media import absolute_media_url
from apps.core.models import SiteSetting
from apps.enquiries.models import Enquiry


class ManageBrandSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Brand
        fields = (
            "id",
            "name",
            "slug",
            "logo",
            "logo_url",
            "description",
            "sort_order",
            "is_active",
        )
        extra_kwargs = {"logo": {"write_only": True, "required": False}}

    def get_logo_url(self, obj):
        if not obj.logo:
            return None
        return absolute_media_url(obj.logo.url, self.context.get("request"))


class ManageCategorySerializer(serializers.ModelSerializer):
    hero_image_url = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source="parent.name", read_only=True, default=None)

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "parent",
            "parent_name",
            "hero_image",
            "hero_image_url",
            "description",
            "sort_order",
            "is_active",
        )
        extra_kwargs = {"hero_image": {"write_only": True, "required": False}}

    def get_hero_image_url(self, obj):
        if not obj.hero_image:
            return None
        return absolute_media_url(obj.hero_image.url, self.context.get("request"))


class ManageProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ("id", "image", "image_url", "alt_text", "sort_order")
        read_only_fields = ("id", "image_url")
        extra_kwargs = {"image": {"write_only": True, "required": False}}

    def get_image_url(self, obj):
        if not obj.image:
            return None
        return absolute_media_url(obj.image.url, self.context.get("request"))


class ManageProductSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        source="categories",
        many=True,
        queryset=Category.objects.all(),
        required=False,
    )
    images = ManageProductImageSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "brand",
            "brand_name",
            "category_ids",
            "sku",
            "price",
            "currency",
            "short_description",
            "long_description",
            "specs",
            "is_featured",
            "is_published",
            "sort_order",
            "images",
            "primary_image",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "images", "primary_image", "brand_name")

    def get_primary_image(self, obj):
        image = obj.images.order_by("sort_order", "id").first()
        if not image or not image.image:
            return None
        return absolute_media_url(image.image.url, self.context.get("request"))

    def create(self, validated_data):
        categories = validated_data.pop("categories", [])
        product = Product.objects.create(**validated_data)
        if categories:
            product.categories.set(categories)
        return product

    def update(self, instance, validated_data):
        categories = validated_data.pop("categories", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if categories is not None:
            instance.categories.set(categories)
        return instance


class ManageEnquirySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True, default=None)

    class Meta:
        model = Enquiry
        fields = (
            "id",
            "name",
            "phone",
            "email",
            "message",
            "product",
            "product_name",
            "is_handled",
            "created_at",
        )
        read_only_fields = (
            "id",
            "name",
            "phone",
            "email",
            "message",
            "product",
            "product_name",
            "created_at",
        )


class ManageSiteSettingSerializer(serializers.ModelSerializer):
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
            "notify_enquiries_to",
        )
