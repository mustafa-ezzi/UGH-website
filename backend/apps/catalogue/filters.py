import django_filters

from apps.catalogue.models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="categories__slug", lookup_expr="iexact")
    brand = django_filters.CharFilter(field_name="brand__slug", lookup_expr="iexact")
    featured = django_filters.BooleanFilter(field_name="is_featured")

    class Meta:
        model = Product
        fields = ["category", "brand", "featured"]
