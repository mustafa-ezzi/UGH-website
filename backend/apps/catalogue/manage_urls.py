from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.catalogue.manage_views import (
    ManageBrandViewSet,
    ManageCategoryViewSet,
    ManageDashboardView,
    ManageEnquiryViewSet,
    ManageHomepageSlideViewSet,
    ManageProductImageView,
    ManageProductViewSet,
    ManageSiteSettingView,
)
from apps.core.auth_views import LoginView, LogoutView, MeView

router = DefaultRouter()
router.register("brands", ManageBrandViewSet, basename="manage-brand")
router.register("categories", ManageCategoryViewSet, basename="manage-category")
router.register("products", ManageProductViewSet, basename="manage-product")
router.register("enquiries", ManageEnquiryViewSet, basename="manage-enquiry")
router.register("carousel-slides", ManageHomepageSlideViewSet, basename="manage-carousel-slide")

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="manage-login"),
    path("auth/logout/", LogoutView.as_view(), name="manage-logout"),
    path("auth/me/", MeView.as_view(), name="manage-me"),
    path("dashboard/", ManageDashboardView.as_view(), name="manage-dashboard"),
    path("settings/", ManageSiteSettingView.as_view(), name="manage-settings"),
    path(
        "product-images/<int:pk>/",
        ManageProductImageView.as_view(),
        name="manage-product-image",
    ),
    path("", include(router.urls)),
]
