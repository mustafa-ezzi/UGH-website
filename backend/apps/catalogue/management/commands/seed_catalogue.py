from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.catalogue.models import Brand, Category, Product
from apps.core.models import SiteSetting


SAMPLE_BRANDS = [
    {"name": "UGH Studio", "description": "House collection — precision kitchen appliances."},
    {"name": "Forte Steel", "description": "European-inspired built-in ranges and hoods."},
    {"name": "Lumenaire", "description": "Chimneys and extraction with quiet power."},
    {"name": "Basin & Form", "description": "Sinks, basins, and hardware with clean lines."},
]

SAMPLE_CATEGORIES = [
    {"name": "Stoves & Hobs", "slug": "stoves-hobs", "sort_order": 1},
    {"name": "Chimneys & Hoods", "slug": "chimneys-hoods", "sort_order": 2},
    {"name": "Ovens", "slug": "ovens", "sort_order": 3},
    {"name": "Sinks & Basins", "slug": "sinks-basins", "sort_order": 4},
    {"name": "Hardware", "slug": "hardware", "sort_order": 5},
]

SAMPLE_PRODUCTS = [
    {
        "name": "Ember Dual-Fuel Range 90",
        "brand": "UGH Studio",
        "categories": ["stoves-hobs"],
        "sku": "UGH-RNG-90",
        "price": "349999.00",
        "short_description": "90cm dual-fuel range with brass accents and seven burners.",
        "long_description": "A statement range cooker built for serious kitchens — gas hob precision with electric oven consistency.",
        "specs": {"width_cm": 90, "fuel": "dual-fuel", "burners": 7, "finish": "brushed steel"},
        "is_featured": True,
        "sort_order": 1,
    },
    {
        "name": "Nova Induction Hob 80",
        "brand": "Forte Steel",
        "categories": ["stoves-hobs"],
        "sku": "FS-IND-80",
        "price": "189999.00",
        "short_description": "Flush black glass induction with bridge zones.",
        "long_description": "Responsive touch controls and flexible cooking zones for modern countertops.",
        "specs": {"width_cm": 80, "fuel": "induction", "zones": 4, "finish": "black glass"},
        "is_featured": True,
        "sort_order": 2,
    },
    {
        "name": "Aether Wall Chimney 90",
        "brand": "Lumenaire",
        "categories": ["chimneys-hoods"],
        "sku": "LM-CH-90",
        "price": "129999.00",
        "short_description": "Quiet wall-mounted chimney with warm under-lighting.",
        "long_description": "Keeps vapour clear without shouting — steel body, soft LED wash, three speeds.",
        "specs": {"width_cm": 90, "type": "wall", "speeds": 3, "noise_db": 58},
        "is_featured": True,
        "sort_order": 3,
    },
    {
        "name": "Isle Suspended Hood",
        "brand": "Lumenaire",
        "categories": ["chimneys-hoods"],
        "sku": "LM-ISL-01",
        "price": "219999.00",
        "short_description": "Island extractor designed as a floating steel plane.",
        "long_description": "Centered extraction for open kitchens — architectural silhouette, strong airflow.",
        "specs": {"width_cm": 100, "type": "island", "finish": "stainless"},
        "is_featured": False,
        "sort_order": 4,
    },
    {
        "name": "Pyro Built-in Oven 60",
        "brand": "Forte Steel",
        "categories": ["ovens"],
        "sku": "FS-OV-60",
        "price": "159999.00",
        "short_description": "60cm pyrolytic oven with soft-close door.",
        "long_description": "Even heat, self-clean cycle, and a dark glass face that sits flush in cabinetry.",
        "specs": {"width_cm": 60, "functions": 11, "self_clean": "pyrolytic"},
        "is_featured": True,
        "sort_order": 5,
    },
    {
        "name": "Steam Companion Compact",
        "brand": "UGH Studio",
        "categories": ["ovens"],
        "sku": "UGH-STM-45",
        "price": "174999.00",
        "short_description": "45cm steam oven for precision cooking.",
        "long_description": "Companion steam module for bakers and meal-preppers who want controlled moisture.",
        "specs": {"width_cm": 45, "type": "steam", "finish": "black glass"},
        "is_featured": False,
        "sort_order": 6,
    },
    {
        "name": "Cascade Undermount Sink",
        "brand": "Basin & Form",
        "categories": ["sinks-basins"],
        "sku": "BF-SK-UM",
        "price": "64999.00",
        "short_description": "Double-bowl stainless undermount with quiet pads.",
        "long_description": "Deep bowls, clean edges, and sound-dampening pads for everyday kitchen calm.",
        "specs": {"material": "304 stainless", "mount": "undermount", "bowls": 2},
        "is_featured": False,
        "sort_order": 7,
    },
    {
        "name": "Arc Pull-Down Mixer",
        "brand": "Basin & Form",
        "categories": ["sinks-basins", "hardware"],
        "sku": "BF-TP-ARC",
        "price": "42999.00",
        "short_description": "Single-lever pull-down faucet in brushed steel.",
        "long_description": "Smooth arc spout with dual spray modes — designed to pair with Cascade sinks.",
        "specs": {"finish": "brushed steel", "spray": "dual", "mount": "deck"},
        "is_featured": True,
        "sort_order": 8,
    },
    {
        "name": "Soft-Close Basket Set",
        "brand": "UGH Studio",
        "categories": ["hardware"],
        "sku": "UGH-BSK-03",
        "price": "28999.00",
        "short_description": "Three-tier pull-out baskets with soft-close runners.",
        "long_description": "Organise deep cabinets without noise — chrome wire, full-extension runners.",
        "specs": {"tiers": 3, "runner": "soft-close", "finish": "chrome"},
        "is_featured": False,
        "sort_order": 9,
    },
    {
        "name": "Linea Gas Hob 75",
        "brand": "Forte Steel",
        "categories": ["stoves-hobs"],
        "sku": "FS-GAS-75",
        "price": "119999.00",
        "short_description": "Five-burner gas hob with cast-iron supports.",
        "long_description": "Reliable flame control and sturdy pan supports for everyday and wok cooking.",
        "specs": {"width_cm": 75, "fuel": "gas", "burners": 5},
        "is_featured": False,
        "sort_order": 10,
    },
    {
        "name": "Quiet Downdraft Extractor",
        "brand": "Lumenaire",
        "categories": ["chimneys-hoods"],
        "sku": "LM-DD-01",
        "price": "249999.00",
        "short_description": "Pop-up downdraft for island hobs.",
        "long_description": "Rises when needed, disappears when not — ideal for open-plan kitchens.",
        "specs": {"type": "downdraft", "width_cm": 90, "finish": "black"},
        "is_featured": False,
        "sort_order": 11,
    },
    {
        "name": "Mono Basin Bowl",
        "brand": "Basin & Form",
        "categories": ["sinks-basins"],
        "sku": "BF-BN-01",
        "price": "38999.00",
        "short_description": "Single-bowl stainless basin with fine radius corners.",
        "long_description": "Compact, hygienic, and easy to clean — for secondary prep zones or wet bars.",
        "specs": {"material": "304 stainless", "mount": "topmount", "bowls": 1},
        "is_featured": False,
        "sort_order": 12,
    },
]


class Command(BaseCommand):
    help = "Seed brands, categories, sample products, and site settings for UGH Appliances."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush-catalogue",
            action="store_true",
            help="Delete existing products/brands/categories before seeding.",
        )

    def handle(self, *args, **options):
        if options["flush_catalogue"]:
            Product.objects.all().delete()
            Category.objects.all().delete()
            Brand.objects.all().delete()
            self.stdout.write(self.style.WARNING("Catalogue cleared."))

        brands = {}
        for item in SAMPLE_BRANDS:
            brand, _ = Brand.objects.update_or_create(
                name=item["name"],
                defaults={"description": item["description"], "is_active": True},
            )
            brands[brand.name] = brand

        categories = {}
        for item in SAMPLE_CATEGORIES:
            category, _ = Category.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "name": item["name"],
                    "sort_order": item["sort_order"],
                    "is_active": True,
                },
            )
            categories[category.slug] = category

        created = 0
        updated = 0
        for item in SAMPLE_PRODUCTS:
            brand = brands[item["brand"]]
            product, was_created = Product.objects.update_or_create(
                sku=item["sku"],
                defaults={
                    "name": item["name"],
                    "brand": brand,
                    "price": Decimal(item["price"]),
                    "currency": "PKR",
                    "short_description": item["short_description"],
                    "long_description": item["long_description"],
                    "specs": item["specs"],
                    "is_featured": item["is_featured"],
                    "is_published": True,
                    "sort_order": item["sort_order"],
                },
            )
            product.categories.set([categories[slug] for slug in item["categories"]])
            if was_created:
                created += 1
            else:
                updated += 1

        settings = SiteSetting.load()
        settings.site_name = "UGH Appliances"
        settings.tagline = "Precision born from heat."
        settings.hero_supporting_text = (
            "Stoves, chimneys, ovens, and basins — crafted for kitchens that mean something."
        )
        settings.about_blurb = (
            "UGH Appliances showcases refined kitchen appliances — catalogue first, "
            "enquiry when you are ready. No cart. No checkout. Just the craft."
        )
        settings.contact_email = "hello@ugh-appliances.local"
        settings.contact_phone = "+92 300 0000000"
        settings.homepage_quote = "Everything is designed. Few things are designed well."
        settings.featured_section_eyebrow = "Unique products only in UGH"
        settings.featured_section_title = "Explore a great range of products"
        settings.show_featured_section = True
        settings.show_category_ribbon = True
        settings.notify_enquiries_to = "hello@ugh-appliances.local"
        settings.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete: {created} products created, {updated} updated. "
                f"{len(brands)} brands, {len(categories)} categories."
            )
        )
