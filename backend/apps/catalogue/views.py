from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, mixins, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny

from apps.catalogue.filters import ProductFilter
from apps.catalogue.models import Brand, Category, Product
from apps.catalogue.serializers import (
    BrandSerializer,
    CategorySerializer,
    EnquiryCreateSerializer,
    HomepageSlideSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    SiteSettingSerializer,
)
from apps.core.models import HomepageSlide, SiteSetting
from apps.enquiries.models import Enquiry


class BrandListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = BrandSerializer
    queryset = Brand.objects.filter(is_active=True)
    pagination_class = None


class CategoryListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer
    queryset = Category.objects.filter(is_active=True)
    pagination_class = None


class ProductViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ["name", "sku", "short_description", "brand__name"]
    ordering_fields = ["sort_order", "name", "price", "created_at"]
    ordering = ["sort_order", "name"]

    def get_queryset(self):
        return (
            Product.objects.filter(is_published=True)
            .select_related("brand")
            .prefetch_related("categories", "images")
            .distinct()
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer


class EnquiryCreateView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = EnquiryCreateSerializer
    queryset = Enquiry.objects.all()


class SiteSettingView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = SiteSettingSerializer

    def get_object(self):
        return SiteSetting.load()


class HomepageSlideListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = HomepageSlideSerializer
    pagination_class = None
    queryset = HomepageSlide.objects.filter(is_active=True)
