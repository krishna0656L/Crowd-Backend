import os

workers = 4
worker_class = "sync"
port = int(os.environ.get("PYTHON_PORT", "10000"))
bind = f"0.0.0.0:{port}"
timeout = 120
keepalive = 5
