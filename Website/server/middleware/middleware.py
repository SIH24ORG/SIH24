from flask import request

def log_request():
    print(f"Request: {request.method} {request.path}")
