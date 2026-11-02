#!/usr/bin/env python3
"""
Labtrail Local Host Web Server
Serves the extracted Labtrail Application directly from the DMG on localhost (127.0.0.1).
Supports interactive screen markup, visual feedback, and bug annotations via /api/feedback.
"""
import sys
import os
import json
import base64
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT_DIR = Path(__file__).resolve().parent
DIST_DIR = ROOT_DIR / "dist"
FEEDBACK_DIR = ROOT_DIR / "feedback"
FEEDBACK_DIR.mkdir(parents=True, exist_ok=True)
CALENDAR_FILE = ROOT_DIR / "calendar.ics"

DEFAULT_PORT = 3000
PORT = int(os.environ.get("SAI_PORT", sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].isdigit() else DEFAULT_PORT))

APP_NAME = "Labtrail"
APP_VERSION = "1.0.0"

class SaiHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST_DIR), **kwargs)

    def is_loopback_host(self) -> bool:
        host = self.headers.get("Host", "").strip().split(":")[0]
        return host in ("127.0.0.1", "localhost", "::1", "0.0.0.0")

    def end_headers(self):
        origin = self.headers.get("Origin", "")
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
        else:
            self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_HEAD(self):
        clean_path = urllib.parse.unquote(self.path.split("?")[0])
        if clean_path in ("/api/status", "/api/health", "/api/feedback"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            return
        return super().do_HEAD()

    def do_GET(self):
        clean_path = urllib.parse.unquote(self.path.split("?")[0])

        # Prevent directory traversal
        if ".." in clean_path or "\\" in clean_path:
            self.send_error(403, "Forbidden: Invalid traversal path")
            return

        # Health and status endpoints
        if clean_path in ("/api/status", "/api/health"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            status_data = {
                "status": "ok",
                "app": APP_NAME,
                "version": APP_VERSION,
                "localhost": True,
                "port": PORT,
                "url": f"http://127.0.0.1:{PORT}",
                "feedback_dir": str(FEEDBACK_DIR)
            }
            self.wfile.write(json.dumps(status_data, indent=2).encode("utf-8"))
            return

        # Calendar iCal subscription feed (Google Calendar & Outlook live feed)
        if clean_path in ("/api/calendar/feed.ics", "/calendar.ics"):
            self.send_response(200)
            self.send_header("Content-Type", "text/calendar; charset=utf-8")
            self.send_header("Content-Disposition", 'inline; filename="labtrail-calendar.ics"')
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.end_headers()
            if CALENDAR_FILE.exists():
                self.wfile.write(CALENDAR_FILE.read_bytes())
            else:
                default_ics = (
                    "BEGIN:VCALENDAR\r\n"
                    "VERSION:2.0\r\n"
                    "PRODID:-//Labtrail//Project Management//EN\r\n"
                    "CALSCALE:GREGORIAN\r\n"
                    "METHOD:PUBLISH\r\n"
                    "X-WR-CALNAME:Labtrail Workspace Calendar\r\n"
                    "X-WR-TIMEZONE:UTC\r\n"
                    "END:VCALENDAR\r\n"
                )
                self.wfile.write(default_ics.encode("utf-8"))
            return

        if clean_path == "/api/calendar/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            stat = {
                "active": CALENDAR_FILE.exists(),
                "feedUrl": f"http://127.0.0.1:{PORT}/api/calendar/feed.ics",
                "webcalUrl": f"webcal://127.0.0.1:{PORT}/api/calendar/feed.ics",
                "lastModified": datetime.fromtimestamp(CALENDAR_FILE.stat().st_mtime).isoformat() if CALENDAR_FILE.exists() else None,
                "sizeBytes": CALENDAR_FILE.stat().st_size if CALENDAR_FILE.exists() else 0
            }
            self.wfile.write(json.dumps(stat, indent=2).encode("utf-8"))
            return

        # List saved feedback / annotations
        if clean_path == "/api/feedback":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            items = []
            for json_path in sorted(FEEDBACK_DIR.glob("feedback-*.json"), reverse=True):
                try:
                    data = json.loads(json_path.read_text(encoding="utf-8"))
                    png_name = json_path.stem + ".png"
                    if (FEEDBACK_DIR / png_name).exists():
                        data["screenshot_url"] = f"/feedback/{png_name}"
                    items.append(data)
                except Exception:
                    pass
            self.wfile.write(json.dumps(items, indent=2).encode("utf-8"))
            return

        # Serve saved feedback images
        if clean_path.startswith("/feedback/"):
            filename = clean_path.replace("/feedback/", "")
            target = (FEEDBACK_DIR / filename).resolve()
            if target.exists() and target.is_file() and str(target).startswith(str(FEEDBACK_DIR.resolve())):
                self.send_response(200)
                if filename.endswith(".png"):
                    self.send_header("Content-Type", "image/png")
                elif filename.endswith(".json"):
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(target.read_bytes())
                return
            else:
                self.send_error(404, "Feedback file not found")
                return

        # Favicon shortcut
        if clean_path == "/favicon.ico":
            icon_file = DIST_DIR / "icon.png"
            if icon_file.exists():
                self.send_response(200)
                self.send_header("Content-Type", "image/png")
                self.end_headers()
                self.wfile.write(icon_file.read_bytes())
                return

        # Fallback for /index.css
        if clean_path == "/index.css":
            css_file = DIST_DIR / "index.css"
            self.send_response(200)
            self.send_header("Content-Type", "text/css; charset=utf-8")
            self.end_headers()
            if css_file.exists():
                self.wfile.write(css_file.read_bytes())
            else:
                self.wfile.write(b"/* Labtrail CSS */\n")
            return

        # Static file check within DIST_DIR
        rel_path = clean_path.lstrip("/") or "index.html"
        target = (DIST_DIR / rel_path).resolve()

        try:
            target.relative_to(DIST_DIR.resolve())
        except ValueError:
            self.send_error(403, "Forbidden: Path escapes distribution directory")
            return

        # SPA fallback: serve index.html if file doesn't exist
        if not target.exists() or target.is_dir():
            index_file = DIST_DIR / "index.html"
            if index_file.exists():
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(index_file.read_bytes())
                return

        return super().do_GET()

    def do_POST(self):
        clean_path = urllib.parse.unquote(self.path.split("?")[0])

        if clean_path == "/api/feedback":
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > 50 * 1024 * 1024:  # 50MB limit
                self.send_response(413)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Payload too large"}).encode("utf-8"))
                return

            body = self.rfile.read(content_length)
            try:
                payload = json.loads(body.decode("utf-8"))
                message = payload.get("message", "").strip()
                screenshot = payload.get("screenshot")

                timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H-%M-%S")
                meta = {
                    "timestamp": timestamp,
                    "message": message,
                    "has_screenshot": bool(screenshot)
                }

                # Save JSON metadata
                meta_file = FEEDBACK_DIR / f"feedback-{timestamp}.json"
                meta_file.write_text(json.dumps(meta, indent=2), encoding="utf-8")

                # Save screenshot if provided
                if screenshot and isinstance(screenshot, str) and screenshot.startswith("data:image/png;base64,"):
                    raw_b64 = screenshot.split(",", 1)[1]
                    img_bytes = base64.b64decode(raw_b64)
                    img_file = FEEDBACK_DIR / f"feedback-{timestamp}.png"
                    img_file.write_bytes(img_bytes)

                print(f"📸 Saved annotation & feedback: feedback-{timestamp} ({message[:40]}...)")
                sys.stdout.flush()

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "message": "Feedback successfully saved to project disk!"}).encode("utf-8"))
                return

            except Exception as e:
                print(f"Error handling feedback: {e}")
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))
                return

        if clean_path == "/api/calendar/sync":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            try:
                payload = json.loads(body.decode("utf-8"))
                ics_data = payload.get("ics", "")
                items_count = payload.get("itemsCount", 0)
                if ics_data:
                    CALENDAR_FILE.write_text(ics_data, encoding="utf-8")
                    print(f"📅 Synced Labtrail calendar feed: {items_count} items ({len(ics_data)} bytes)")
                    sys.stdout.flush()

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                res = {
                    "success": True,
                    "feedUrl": f"http://127.0.0.1:{PORT}/api/calendar/feed.ics",
                    "webcalUrl": f"webcal://127.0.0.1:{PORT}/api/calendar/feed.ics",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "itemsSynced": items_count
                }
                self.wfile.write(json.dumps(res, indent=2).encode("utf-8"))
                return
            except Exception as e:
                print(f"Error syncing calendar: {e}")
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))
                return

        if clean_path == "/api/calendar/fetch-url":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            try:
                payload = json.loads(body.decode("utf-8"))
                target_url = payload.get("url", "").strip()
                if not target_url:
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "error": "URL is required"}).encode("utf-8"))
                    return

                if target_url.startswith("webcal://"):
                    target_url = "https://" + target_url[9:]
                elif not (target_url.startswith("http://") or target_url.startswith("https://")):
                    target_url = "https://" + target_url

                req = urllib.request.Request(
                    target_url,
                    headers={"User-Agent": "Mozilla/5.0 (compatible; SaiCalendarSync/1.0)"}
                )
                with urllib.request.urlopen(req, timeout=12) as response:
                    raw_content = response.read().decode("utf-8", errors="replace")

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "ics": raw_content}).encode("utf-8"))
                return
            except Exception as e:
                print(f"Error fetching external calendar: {e}")
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": f"Failed to fetch external calendar: {str(e)}"}).encode("utf-8"))
                return

        self.send_error(404, "Endpoint not found")

def find_available_port(start_port: int, max_attempts: int = 10) -> int:
    import socket
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return start_port

def main():
    global PORT
    PORT = find_available_port(PORT)
    server_address = ("127.0.0.1", PORT)
    server = ThreadingHTTPServer(server_address, SaiHandler)
    print(f"✨ Labtrail Local Host running at: http://127.0.0.1:{PORT}")
    print(f"✨ Browser URL: http://localhost:{PORT}")
    print(f"✨ Health Check: http://127.0.0.1:{PORT}/api/health")
    print(f"✨ Feedback Directory: {FEEDBACK_DIR}")
    sys.stdout.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nSai Local Host stopped.")
        sys.exit(0)

if __name__ == "__main__":
    main()
