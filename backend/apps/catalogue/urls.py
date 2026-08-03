from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.catalogue.views import (
    BrandListView,
    CategoryListView,
    EnquiryCreateView,
    ProductViewSet,
    SiteSettingView,
)

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")

urlpatterns = [
    path("brands/", BrandListView.as_view(), name="brand-list"),
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("enquiries/", EnquiryCreateView.as_view(), name="enquiry-create"),
    path("settings/", SiteSettingView.as_view(), name="site-settings"),
    path("", include(router.urls)),
]
