"""
Custom permission classes for the API.
"""

from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """
    Permission that only allows owners of an object to access it.
    Expects the object to have a 'user' attribute.
    """

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission that allows read access to all, but write access only to owners.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


class IsMaerskEmployee(permissions.BasePermission):
    """
    Permission that only allows Maersk employees (verified email domain).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.email.endswith("@maersk.com")


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission that allows full access to staff, read-only for others.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff
