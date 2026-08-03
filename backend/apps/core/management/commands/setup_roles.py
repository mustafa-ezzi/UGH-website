from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand

from apps.catalogue.models import Brand, Category, Product, ProductImage
from apps.core.models import SiteSetting
from apps.enquiries.models import Enquiry

EDITOR_GROUP = "Editors"
SUPER_HINT = "Superadmin = Django superuser (is_superuser=True)."


class Command(BaseCommand):
    help = (
        "Create the Editors group with catalogue/enquiry permissions. "
        "Superadmins remain Django superusers."
    )

    def handle(self, *args, **options):
        group, created = Group.objects.get_or_create(name=EDITOR_GROUP)

        # Editors can manage catalogue day-to-day + view/handle enquiries + edit site settings
        models = [
            Brand,
            Category,
            Product,
            ProductImage,
            Enquiry,
            SiteSetting,
        ]
        perms = []
        for model in models:
            ct = ContentType.objects.get_for_model(model)
            for codename_prefix in ("add", "change", "view"):
                # Editors should not delete SiteSetting; can delete products/images
                if model is SiteSetting and codename_prefix == "add":
                    continue
                codename = f"{codename_prefix}_{model._meta.model_name}"
                try:
                    perms.append(Permission.objects.get(content_type=ct, codename=codename))
                except Permission.DoesNotExist:
                    continue

            if model is not SiteSetting:
                delete_code = f"delete_{model._meta.model_name}"
                try:
                    perms.append(Permission.objects.get(content_type=ct, codename=delete_code))
                except Permission.DoesNotExist:
                    pass

        group.permissions.set(perms)
        group.save()

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(
                f"{action} group '{EDITOR_GROUP}' with {group.permissions.count()} permissions. "
                f"{SUPER_HINT} Assign staff users to Editors via Admin > Users."
            )
        )
