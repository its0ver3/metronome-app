"""Serve the isolated test build and retain its locally generated measurements."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[2]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / 'tmp/visual-sync-static'), **kwargs)
    def do_POST(self):
        if self.path != '/__results':
            self.send_error(404)
            return
        size = int(self.headers.get('Content-Length', '0'))
        if not 0 < size < 2_000_000:
            self.send_error(400)
            return
        data = json.loads(self.rfile.read(size))
        label = data['summary']['label']
        if not re.fullmatch(r'[a-z0-9-]{1,80}', label):
            self.send_error(400)
            return
        path = ROOT / 'docs/visual-sync-evidence' / f'{label}.json'
        path.write_text(json.dumps(data, indent=2) + '\n')
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'saved')
    def log_message(self, fmt, *args):
        if self.command == 'POST': super().log_message(fmt, *args)

ThreadingHTTPServer(('127.0.0.1', 4180), Handler).serve_forever()
