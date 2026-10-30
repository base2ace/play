"""
High-Performance Streaming Server for Ramleela Website
Supports local video file streaming with full HTTP 206 Range requests (H.264/AAC),
with fallback to Google Drive proxy.
"""

import http.server
import socketserver
import urllib.request
import os
import re
import mimetypes

PORT = 8899
LOCAL_VIDEO_PATH = r"C:\MyWork\Antigravity\local-network-transfer\uploads\FinalRamleela_DoNotChange.mov"
GDRIVE_FILE_ID = "1qKjs42FHvkA9tz_5JhZXn9I7L70uWm-K"
DIRECT_GDRIVE_URL = f"https://drive.usercontent.google.com/download?id={GDRIVE_FILE_ID}&export=download&confirm=t"

class StreamingHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Range, Content-Type, Accept-Encoding')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_HEAD(self):
        if self.path.startswith('/api/stream-video'):
            self.stream_video(is_head=True)
        else:
            super().do_HEAD()

    def do_GET(self):
        if self.path.startswith('/api/stream-video'):
            self.stream_video(is_head=False)
        else:
            super().do_GET()

    def stream_video(self, is_head=False):
        # 1. Prefer local video file if available for ultra-fast local testing
        if os.path.exists(LOCAL_VIDEO_PATH):
            self.stream_local_file(LOCAL_VIDEO_PATH, is_head)
        else:
            self.stream_gdrive_proxy(is_head)

    def stream_local_file(self, file_path, is_head=False):
        try:
            file_size = os.path.getsize(file_path)
            range_header = self.headers.get('Range')

            start = 0
            end = file_size - 1

            if range_header:
                m = re.search(r'bytes=(\d+)-(\d*)', range_header)
                if m:
                    start = int(m.group(1))
                    if m.group(2):
                        end = int(m.group(2))

            # Limit chunk size to avoid huge single read
            chunk_length = (end - start) + 1
            max_chunk = 4 * 1024 * 1024  # 4MB chunks
            if chunk_length > max_chunk:
                end = start + max_chunk - 1
                chunk_length = (end - start) + 1

            if range_header:
                self.send_response(206)
                self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
            else:
                self.send_response(200)

            self.send_header('Content-Type', 'video/mp4')
            self.send_header('Content-Length', str(chunk_length))
            self.send_header('Accept-Ranges', 'bytes')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()

            if not is_head:
                with open(file_path, 'rb') as f:
                    f.seek(start)
                    bytes_remaining = chunk_length
                    buffer_size = 256 * 1024
                    while bytes_remaining > 0:
                        to_read = min(buffer_size, bytes_remaining)
                        data = f.read(to_read)
                        if not data:
                            break
                        try:
                            self.wfile.write(data)
                            bytes_remaining -= len(data)
                        except (BrokenPipeError, ConnectionResetError):
                            break
        except Exception as e:
            print("Error streaming local file:", e)

    def stream_gdrive_proxy(self, is_head=False):
        range_header = self.headers.get('Range')
        req = urllib.request.Request(DIRECT_GDRIVE_URL)
        req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        if range_header:
            req.add_header('Range', range_header)

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                status = resp.status
                self.send_response(status)
                for h in ['Content-Type', 'Content-Range', 'Content-Length', 'Accept-Ranges', 'Last-Modified']:
                    val = resp.headers.get(h)
                    if val:
                        self.send_header(h, val)
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()

                if not is_head:
                    chunk_size = 256 * 1024
                    while True:
                        chunk = resp.read(chunk_size)
                        if not chunk:
                            break
                        try:
                            self.wfile.write(chunk)
                        except (BrokenPipeError, ConnectionResetError):
                            break
        except Exception as e:
            pass

def run():
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), StreamingHandler) as httpd:
        print(f"Ramleela Streaming Server running at http://localhost:{PORT}")
        httpd.serve_forever()

if __name__ == '__main__':
    run()
