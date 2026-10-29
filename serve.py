#use to host local server to test changes

import http.server, re

class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # remove the /<project-id>/port/<number> prefix CoCalc adds
        path = re.sub(r"^/[0-9a-f-]{36}/port/\d+", "", path) or "/"
        return super().translate_path(path)

http.server.ThreadingHTTPServer(("0.0.0.0", 8001), Handler).serve_forever()
