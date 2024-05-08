import http.server
import socketserver

handler = http.server.SimpleHTTPRequestHandler

port = 8080

httpd = socketserver.TCPServer(("localhost", port), handler)

print(f"Serving on port {port}")

httpd.serve_forever()