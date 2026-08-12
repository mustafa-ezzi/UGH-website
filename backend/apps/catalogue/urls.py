from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.catalogue.views import (
    BrandListView,
    CategoryListView,
    EnquiryCreateView,
    HomepageSlideListView,
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
    path("carousel-slides/", HomepageSlideListView.as_view(), name="carousel-slide-list"),
    path("", include(router.urls)),
]
