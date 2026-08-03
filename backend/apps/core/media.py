"""Shared helpers for media / CDN URLs."""


def absolute_media_url(url: str | None, request=None) -> str | None:
    """Return a browser-usable URL; keep R2/CDN links as-is."""
    if not url:
        return None
    if url.startswith("http://") or url.startswith("https://"):
        return url
    if request is not None:
        return request.build_absolute_uri(url)
    return url
