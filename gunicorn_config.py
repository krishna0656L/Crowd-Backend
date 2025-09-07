import os
import multiprocessing

# Server socket
bind = f"0.0.0.0:{os.environ.get('PYTHON_PORT', '10000')}"

# Worker processes
workers = min(multiprocessing.cpu_count() * 2 + 1, 4)  # 2-4 workers based on CPU
worker_class = 'sync'
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50

# Timeouts
timeout = 120
keepalive = 5

# Logging
loglevel = 'info'
errorlog = 'logs/gunicorn-error.log'
accesslog = 'logs/gunicorn-access.log'

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190
