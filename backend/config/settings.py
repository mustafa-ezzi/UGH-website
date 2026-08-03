"""Django settings for UGH Appliances."""

from pathlib import Path
import os

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "insecure-dev-key")
DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() in {"1", "true", "yes"}

def _split_env_list(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


# Hosts: explicit env + Railway public domain (avoids DisallowedHost 400)
_allowed = _split_env_list(
    os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")
)
_railway_domain = os.getenv("RAILWAY_PUBLIC_DOMAIN", "").strip()
if _railway_domain and _railway_domain not in _allowed:
    _allowed.append(_railway_domain)
# Common Railway suffix — safe when DEBUG is off on Railway only via env below
if os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_PROJECT_ID"):
    if ".up.railway.app" not in " ".join(_allowed):
        _allowed.append(".up.railway.app")
ALLOWED_HOSTS = _allowed or ["*"]

CSRF_TRUSTED_ORIGINS = _split_env_list(
    os.getenv(
        "DJANGO_CSRF_TRUSTED_ORIGINS",
        ",".join(
            origin
            for origin in [
                f"https://{_railway_domain}" if _railway_domain else "",
                "https://*.up.railway.app",
            ]
            if origin
        ),
    )
)
# Ensure https scheme entries Django accepts
CSRF_TRUSTED_ORIGINS = [
    o if o.startswith("http") else f"https://{o}" for o in CSRF_TRUSTED_ORIGINS
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "adminsortable2",
    "corsheaders",
    "django_filters",
    "rest_framework",
    "rest_framework.authtoken",
    # Local
    "apps.catalogue",
    "apps.enquiries",
    "apps.core",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

def _postgres_from_url(url: str) -> dict:
    """Parse postgres:// or postgresql:// URLs (Railway DATABASE_URL)."""
    from urllib.parse import unquote, urlparse

    parsed = urlparse(url)
    if parsed.scheme not in {"postgres", "postgresql"}:
        raise ValueError(f"Unsupported DATABASE_URL scheme: {parsed.scheme}")
    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": unquote(parsed.path.lstrip("/")),
        "USER": unquote(parsed.username or ""),
        "PASSWORD": unquote(parsed.password or ""),
        "HOST": parsed.hostname or "",
        "PORT": str(parsed.port or 5432),
    }


DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
DATABASE_ENGINE = os.getenv("DATABASE_ENGINE", "sqlite").lower()

if DATABASE_URL:
    DATABASES = {"default": _postgres_from_url(DATABASE_URL)}
elif DATABASE_ENGINE == "postgres" or os.getenv("PGHOST"):
    # Railway also exposes PG* vars; fall back to POSTGRES_* names
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("PGDATABASE")
            or os.getenv("POSTGRES_DB", "ugh_appliances"),
            "USER": os.getenv("PGUSER") or os.getenv("POSTGRES_USER", "ugh"),
            "PASSWORD": os.getenv("PGPASSWORD")
            or os.getenv("POSTGRES_PASSWORD", "ugh"),
            "HOST": os.getenv("PGHOST") or os.getenv("POSTGRES_HOST", "localhost"),
            "PORT": os.getenv("PGPORT") or os.getenv("POSTGRES_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Karachi"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Cloudflare R2 / S3-compatible media storage ---
def _env(name: str, default: str = "") -> str:
    return (os.getenv(name, default) or "").strip().strip('"').strip("'")


USE_S3 = _env("USE_S3", "False").lower() in {"1", "true", "yes"}

if USE_S3:
    INSTALLED_APPS = [*INSTALLED_APPS, "storages"]

    AWS_ACCESS_KEY_ID = _env("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = _env("AWS_SECRET_ACCESS_KEY")
    AWS_STORAGE_BUCKET_NAME = _env("AWS_STORAGE_BUCKET_NAME", "ugh")
    AWS_S3_ENDPOINT_URL = _env("AWS_S3_ENDPOINT_URL").rstrip("/")
    AWS_S3_REGION_NAME = _env("AWS_S3_REGION_NAME", "auto") or "auto"
    AWS_DEFAULT_ACL = None
    AWS_QUERYSTRING_AUTH = False
    AWS_S3_FILE_OVERWRITE = False
    AWS_S3_SIGNATURE_VERSION = "s3v4"
    AWS_S3_ADDRESSING_STYLE = "path"
    AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "public, max-age=86400"}

    _media_public = _env("MEDIA_PUBLIC_BASE_URL").rstrip("/")
    _custom_domain = None
    if _media_public:
        from urllib.parse import urlparse

        _parsed = urlparse(
            _media_public if "://" in _media_public else f"https://{_media_public}"
        )
        _custom_domain = _parsed.netloc
        MEDIA_URL = f"{_parsed.scheme}://{_custom_domain}/"
    elif AWS_S3_ENDPOINT_URL and AWS_STORAGE_BUCKET_NAME:
        MEDIA_URL = f"{AWS_S3_ENDPOINT_URL}/{AWS_STORAGE_BUCKET_NAME}/"

    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3.S3Storage",
            "OPTIONS": {
                "access_key": AWS_ACCESS_KEY_ID,
                "secret_key": AWS_SECRET_ACCESS_KEY,
                "bucket_name": AWS_STORAGE_BUCKET_NAME,
                "endpoint_url": AWS_S3_ENDPOINT_URL or None,
                "region_name": AWS_S3_REGION_NAME,
                "default_acl": None,
                "querystring_auth": False,
                "file_overwrite": False,
                "signature_version": "s3v4",
                "addressing_style": "path",
                "custom_domain": _custom_domain,
                "object_parameters": AWS_S3_OBJECT_PARAMETERS,
            },
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }

# Allow larger product image uploads (match MAX_UPLOAD_SIZE)
DATA_UPLOAD_MAX_MEMORY_SIZE = 6 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 6 * 1024 * 1024

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 24,
}

# Trust Railway / reverse-proxy HTTPS
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

# Image upload limits (bytes) — 5 MB
MAX_UPLOAD_SIZE = 5 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

# Email (console backend for local; set SMTP env vars in production)
EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True").lower() in {"1", "true", "yes"}
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "noreply@ugh-appliances.local")
