from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalogue.manage_serializers import (
    ManageBrandSerializer,
    ManageCategorySerializer,
    ManageEnquirySerializer,
    ManageProductImageSerializer,
    ManageProductSerializer,
    ManageSiteSettingSerializer,
)
from apps.catalogue.models import Brand, Category, Product, ProductImage
from apps.core.models import SiteSetting
from apps.core.permissions import IsStaffUser
from apps.enquiries.models import Enquiry


class ManageDashboardView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        recent = Enquiry.objects.select_related("product").order_by("-created_at")[:6]
        return Response(
            {
                "products_total": Product.objects.count(),
                "products_published": Product.objects.filter(is_published=True).count(),
                "products_featured": Product.objects.filter(is_featured=True).count(),
                "enquiries_open": Enquiry.objects.filter(is_handled=False).count(),
                "enquiries_total": Enquiry.objects.count(),
                "categories": Category.objects.filter(is_active=True).count(),
                "brands": Brand.objects.filter(is_active=True).count(),
                "recent_enquiries": ManageEnquirySerializer(
                    recent, many=True, context={"request": request}
                ).data,
            }
        )


class ManageBrandViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffUser]
    serializer_class = ManageBrandSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    queryset = Brand.objects.all()
    pagination_class = None
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name"]
    ordering = ["sort_order", "name"]


class ManageCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffUser]
    serializer_class = ManageCategorySerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    queryset = Category.objects.all()
    pagination_class = None
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name"]
    ordering = ["sort_order", "name"]


class ManageProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffUser]
    serializer_class = ManageProductSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_published", "is_featured", "brand"]
    search_fields = ["name", "sku", "short_description"]
    ordering_fields = ["sort_order", "name", "price", "updated_at", "created_at"]
    ordering = ["sort_order", "name"]
    lookup_field = "pk"

    def get_queryset(self):
        return (
            Product.objects.all()
            .select_related("brand")
            .prefetch_related("categories", "images")
            .annotate(enquiry_count=Count("enquiries"))
        )

    @action(detail=False, methods=["post"])
    def bulk(self, request):
        ids = request.data.get("ids") or []
        if not isinstance(ids, list) or not ids:
            return Response({"detail": "Provide ids: number[]."}, status=status.HTTP_400_BAD_REQUEST)
        qs = Product.objects.filter(id__in=ids)
        updates = {}
        if "is_published" in request.data:
            updates["is_published"] = bool(request.data["is_published"])
        if "is_featured" in request.data:
            updates["is_featured"] = bool(request.data["is_featured"])
        if not updates:
            return Response({"detail": "Nothing to update."}, status=status.HTTP_400_BAD_REQUEST)
        updated = qs.update(**updates)
        return Response({"updated": updated})

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def images(self, request, pk=None):
        product = self.get_object()
        serializer = ManageProductImageSerializer(
            data={
                "image": request.data.get("image"),
                "alt_text": request.data.get("alt_text", ""),
                "sort_order": request.data.get("sort_order", product.images.count()),
            },
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        image = ProductImage.objects.create(
            product=product,
            image=serializer.validated_data["image"],
            alt_text=serializer.validated_data.get("alt_text", ""),
            sort_order=serializer.validated_data.get("sort_order", 0),
        )
        return Response(
            ManageProductImageSerializer(image, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def bulk_flags(self, request, pk=None):
        product = self.get_object()
        if "is_published" in request.data:
            product.is_published = bool(request.data["is_published"])
        if "is_featured" in request.data:
            product.is_featured = bool(request.data["is_featured"])
        product.save(update_fields=["is_published", "is_featured", "updated_at"])
        return Response(self.get_serializer(product).data)


class ManageProductImageView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsStaffUser]
    serializer_class = ManageProductImageSerializer
    queryset = ProductImage.objects.all()
    parser_classes = [JSONParser, MultiPartParser, FormParser]


class ManageEnquiryViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsStaffUser]
    serializer_class = ManageEnquirySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_handled"]
    search_fields = ["name", "email", "phone", "message", "product__name"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Enquiry.objects.select_related("product").all()

    @action(detail=False, methods=["post"])
    def bulk(self, request):
        ids = request.data.get("ids") or []
        if not isinstance(ids, list) or not ids:
            return Response({"detail": "Provide ids: number[]."}, status=status.HTTP_400_BAD_REQUEST)
        is_handled = bool(request.data.get("is_handled", True))
        updated = Enquiry.objects.filter(id__in=ids).update(is_handled=is_handled)
        return Response({"updated": updated})


class ManageSiteSettingView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsStaffUser]
    serializer_class = ManageSiteSettingSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_object(self):
        return SiteSetting.load()
