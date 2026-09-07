"""Serve the isolated browser checks and save their results on loopback only."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[2]

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / 'tmp/browser-checks'), **kwargs)

    def do_POST(self):
        if self.path != '/__results':
            self.send_error(404)
            return
        size = int(self.headers.get('Content-Length', '0'))
        if not 0 < size < 100_000:
            self.send_error(400)
            return
        try:
            data = json.loads(self.rfile.read(size))
            label = data['label']
            if not isinstance(label, str) or not re.fullmatch(r'[a-z0-9-]{1,60}', label):
                raise ValueError('Invalid label')
        except (ValueError, KeyError, TypeError):
            self.send_error(400)
            return
        folder = ROOT / 'docs/browser-check-evidence'
        folder.mkdir(exist_ok=True)
        (folder / f'{label}.json').write_text(json.dumps(data, indent=2) + '\n')
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'saved')

ThreadingHTTPServer(('127.0.0.1', 4182), Handler).serve_forever()
