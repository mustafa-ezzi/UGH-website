from rest_framework.permissions import BasePermission


class IsStaffUser(BasePermission):
    """Staff or superuser only — for the React manage panel."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_staff)
