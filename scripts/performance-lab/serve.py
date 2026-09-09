"""Loopback-only static harness server with bounded local evidence saving."""
import json
import re
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / 'docs' / 'performance-audit-evidence'

class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/audit-result':
            self.send_error(404)
            return
        length = int(self.headers.get('Content-Length', 0))
        if not 0 < length <= 200000:
            self.send_error(413)
            return
        try:
            result = json.loads(self.rfile.read(length))
            label = result['label']
            if not isinstance(label, str) or not re.fullmatch(r'[a-z0-9-]{1,80}', label):
                raise ValueError('Invalid label')
        except (ValueError, KeyError, TypeError):
            self.send_error(400)
            return
        EVIDENCE.mkdir(parents=True, exist_ok=True)
        (EVIDENCE / f'{label}.json').write_text(json.dumps(result, indent=2) + '\n')
        self.send_response(204)
        self.end_headers()

if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', 4190), partial(Handler, directory=str(ROOT / 'tmp' / 'performance-static'))).serve_forever()
