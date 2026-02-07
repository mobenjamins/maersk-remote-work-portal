"""
Scrape Maersk schedules page using Firecrawl and download all assets.
Extracts: favicon, logo, images, screenshot, branding (colours, fonts).
"""
import os
import json
import base64
import requests
from pathlib import Path

# --- Configuration ---
FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY", "YOUR_API_KEY_HERE")
TARGET_URL = "https://www.maersk.com/schedules/pointToPoint"
OUTPUT_DIR = Path(__file__).parent / "maersk_assets"

def scrape_page():
    """Scrape the Maersk page using Firecrawl API."""
    from firecrawl import FirecrawlApp

    app = FirecrawlApp(api_key=FIRECRAWL_API_KEY)

    print(f"Scraping {TARGET_URL}...")
    result = app.scrape(
        TARGET_URL,
        formats=["markdown", "html", "screenshot", "links"],
    )
    return result


def download_file(url, dest_path):
    """Download a file from URL to local path."""
    try:
        resp = requests.get(url, timeout=30, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        })
        resp.raise_for_status()
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        dest_path.write_bytes(resp.content)
        print(f"  Downloaded: {dest_path.name} ({len(resp.content):,} bytes)")
        return True
    except Exception as e:
        print(f"  Failed to download {url}: {e}")
        return False


def save_screenshot(screenshot_data, output_dir):
    """Save screenshot (base64 or URL) to file."""
    screenshots_dir = output_dir / "screenshots"
    screenshots_dir.mkdir(parents=True, exist_ok=True)

    if screenshot_data and screenshot_data.startswith("data:image"):
        # Base64 encoded
        header, data = screenshot_data.split(",", 1)
        ext = "png" if "png" in header else "jpg"
        img_bytes = base64.b64decode(data)
        path = screenshots_dir / f"maersk_schedule.{ext}"
        path.write_bytes(img_bytes)
        print(f"  Saved screenshot: {path.name} ({len(img_bytes):,} bytes)")
    elif screenshot_data and screenshot_data.startswith("http"):
        download_file(screenshot_data, screenshots_dir / "maersk_schedule.png")
    else:
        print("  No screenshot data found")


def extract_and_download_assets(result):
    """Extract all assets from the scrape result and download them."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # --- Save raw scrape data ---
    raw_dir = OUTPUT_DIR / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    # Save full JSON response
    with open(raw_dir / "scrape_result.json", "w") as f:
        json.dump(result, f, indent=2, default=str)
    print("Saved raw scrape result to scrape_result.json")

    # Save markdown
    if hasattr(result, "markdown") and result.markdown:
        (raw_dir / "page_content.md").write_text(result.markdown)
        print("Saved markdown content")
    elif isinstance(result, dict) and result.get("markdown"):
        (raw_dir / "page_content.md").write_text(result["markdown"])
        print("Saved markdown content")

    # Save HTML
    html_content = None
    if hasattr(result, "html") and result.html:
        html_content = result.html
    elif isinstance(result, dict) and result.get("html"):
        html_content = result["html"]

    if html_content:
        (raw_dir / "page.html").write_text(html_content)
        print("Saved HTML content")

    # --- Screenshot ---
    screenshot = None
    if hasattr(result, "screenshot"):
        screenshot = result.screenshot
    elif isinstance(result, dict):
        screenshot = result.get("screenshot")

    if screenshot:
        save_screenshot(screenshot, OUTPUT_DIR)

    # --- Extract metadata (favicon, og:image, etc.) ---
    metadata = None
    if hasattr(result, "metadata"):
        metadata = result.metadata
    elif isinstance(result, dict):
        metadata = result.get("metadata", {})

    if metadata:
        meta_dir = OUTPUT_DIR / "metadata"
        meta_dir.mkdir(parents=True, exist_ok=True)
        with open(meta_dir / "metadata.json", "w") as f:
            json.dump(metadata, f, indent=2, default=str)
        print("Saved metadata")

        # Download favicon
        favicon_urls = []
        if isinstance(metadata, dict):
            for key in ["favicon", "icon", "shortcut icon", "apple-touch-icon"]:
                if metadata.get(key):
                    favicon_urls.append(metadata[key])
            # og:image
            if metadata.get("ogImage") or metadata.get("og:image"):
                og_img = metadata.get("ogImage") or metadata.get("og:image")
                if isinstance(og_img, list):
                    for item in og_img:
                        if isinstance(item, dict) and item.get("url"):
                            favicon_urls.append(item["url"])
                        elif isinstance(item, str):
                            favicon_urls.append(item)
                elif isinstance(og_img, str):
                    favicon_urls.append(og_img)

        icons_dir = OUTPUT_DIR / "icons"
        icons_dir.mkdir(parents=True, exist_ok=True)
        for i, url in enumerate(favicon_urls):
            if not url.startswith("http"):
                url = f"https://www.maersk.com{url}" if url.startswith("/") else f"https://www.maersk.com/{url}"
            ext = Path(url.split("?")[0]).suffix or ".png"
            filename = f"favicon_{i}{ext}" if "favicon" in url.lower() or i == 0 else f"icon_{i}{ext}"
            download_file(url, icons_dir / filename)

    # --- Download images from page ---
    images_dir = OUTPUT_DIR / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    # Try to get images from the result
    image_urls = set()

    # From links
    links = None
    if hasattr(result, "links"):
        links = result.links
    elif isinstance(result, dict):
        links = result.get("links", [])

    if links:
        for link in links:
            url = link if isinstance(link, str) else link.get("url", "")
            if any(ext in url.lower() for ext in [".png", ".jpg", ".jpeg", ".svg", ".ico", ".gif", ".webp"]):
                image_urls.add(url)

    # From HTML content - extract image sources
    if html_content:
        import re
        # Find img src
        for match in re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html_content):
            image_urls.add(match)
        # Find link rel="icon" href
        for match in re.findall(r'<link[^>]+href=["\']([^"\']+)["\']', html_content):
            if any(ext in match.lower() for ext in [".png", ".jpg", ".ico", ".svg"]):
                image_urls.add(match)
        # Find CSS background images
        for match in re.findall(r'url\(["\']?([^"\')\s]+)["\']?\)', html_content):
            if any(ext in match.lower() for ext in [".png", ".jpg", ".svg", ".webp"]):
                image_urls.add(match)

    print(f"\nFound {len(image_urls)} image URLs to download:")
    for url in sorted(image_urls):
        if not url.startswith("http"):
            url = f"https://www.maersk.com{url}" if url.startswith("/") else f"https://www.maersk.com/{url}"
        filename = Path(url.split("?")[0]).name or "image.png"
        # Clean filename
        filename = filename[:100]  # Truncate long names
        download_file(url, images_dir / filename)

    # --- Also grab known Maersk assets directly ---
    print("\nDownloading known Maersk brand assets...")
    known_assets = {
        "favicon.ico": "https://www.maersk.com/favicon.ico",
        "apple-touch-icon.png": "https://www.maersk.com/apple-touch-icon.png",
        "maersk-logo.svg": "https://www.maersk.com/-/media/project/maersk/shared/icons/maersk-logo.svg",
    }
    brand_dir = OUTPUT_DIR / "brand"
    brand_dir.mkdir(parents=True, exist_ok=True)
    for filename, url in known_assets.items():
        download_file(url, brand_dir / filename)

    print(f"\nAll assets saved to: {OUTPUT_DIR}")
    print("\nDirectory structure:")
    for p in sorted(OUTPUT_DIR.rglob("*")):
        if p.is_file():
            rel = p.relative_to(OUTPUT_DIR)
            print(f"  {rel}")


def main():
    if FIRECRAWL_API_KEY == "YOUR_API_KEY_HERE":
        print("ERROR: Set your Firecrawl API key first!")
        print("  Option 1: export FIRECRAWL_API_KEY='fc-your-key-here'")
        print("  Option 2: Edit this script and replace YOUR_API_KEY_HERE")
        return

    result = scrape_page()
    extract_and_download_assets(result)


if __name__ == "__main__":
    main()
