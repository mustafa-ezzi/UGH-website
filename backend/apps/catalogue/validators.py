from django.conf import settings
from django.core.exceptions import ValidationError
from pathlib import Path


def validate_image_file(file) -> None:
    """Reject oversized or disallowed image uploads."""
    max_size = getattr(settings, "MAX_UPLOAD_SIZE", 5 * 1024 * 1024)
    allowed = getattr(
        settings,
        "ALLOWED_IMAGE_EXTENSIONS",
        {".jpg", ".jpeg", ".png", ".webp", ".gif"},
    )

    size = getattr(file, "size", None)
    if size is not None and size > max_size:
        raise ValidationError(
            f"Image exceeds maximum size of {max_size // (1024 * 1024)} MB."
        )

    name = getattr(file, "name", "") or ""
    ext = Path(name).suffix.lower()
    if ext and ext not in allowed:
        raise ValidationError(
            f"Unsupported image type '{ext}'. Allowed: {', '.join(sorted(allowed))}."
        )
