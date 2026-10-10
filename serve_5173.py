import http.server
import urllib.request
import sys

PORT = 5173
TARGET = "http://127.0.0.1:8000"

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.proxy_request("GET")

    def do_POST(self):
        self.proxy_request("POST")

    def do_PATCH(self):
        self.proxy_request("PATCH")

    def do_PUT(self):
        self.proxy_request("PUT")

    def proxy_request(self, method):
        target_url = f"{TARGET}{self.path}"
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else None

        req_headers = {k: v for k, v in self.headers.items() if k.lower() != "host"}
        
        req = urllib.request.Request(target_url, data=body, headers=req_headers, method=method)
        try:
            with urllib.request.urlopen(req) as resp:
                self.send_response(resp.status)
                for k, v in resp.getheaders():
                    self.send_header(k, v)
                self.end_headers()
                self.wfile.write(resp.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            for k, v in e.headers.items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode())

    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), ProxyHandler)
    print(f"Proxy server running on port {PORT} forwarding to {TARGET}")
    server.serve_forever()
