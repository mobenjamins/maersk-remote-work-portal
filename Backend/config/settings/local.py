"""
Django local development settings.
"""

from .base import *
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(BASE_DIR / ".env")

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

# CORS settings for local development - allow both employee and admin frontends
CORS_ALLOW_ALL_ORIGINS = True  # For development only
CORS_ALLOW_CREDENTIALS = True
# Explicit allowed origins for clarity:
# - localhost:3000 (Employee frontend)
# - localhost:3001 (Admin frontend)
# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:3000",
#     "http://localhost:3001",
#     "http://127.0.0.1:3000",
#     "http://127.0.0.1:3001",
# ]

# Database - SQLite for quick local development (switch to PostgreSQL for production)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Debug toolbar
INSTALLED_APPS += ["debug_toolbar"]
MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE
INTERNAL_IPS = ["127.0.0.1"]

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "apps": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}
