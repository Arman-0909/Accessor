"""
Constants and Configuration Helpers for Accessor API

This module centralises utility constants, role mappings, and configuration
dictionaries used throughout the Accessor ecosystem. Import from here rather
than scattering magic values across modules.
"""

import string
import random

# ---------------------------------------------------------------------------
# HTTP status code → human-readable description mapping
# Covers the full RFC 7231 / IANA registry range.
# ---------------------------------------------------------------------------
ERROR_MESSAGES = {
    100: "Continue",
    101: "Switching Protocols",
    102: "Processing",
    103: "Early Hints",
    200: "OK",
    201: "Created",
    202: "Accepted",
    203: "Non-Authoritative Information",
    204: "No Content",
    205: "Reset Content",
    206: "Partial Content",
    207: "Multi-Status",
    208: "Already Reported",
    226: "IM Used",
    300: "Multiple Choices",
    301: "Moved Permanently",
    302: "Found",
    303: "See Other",
    304: "Not Modified",
    305: "Use Proxy",
    306: "Switch Proxy",
    307: "Temporary Redirect",
    308: "Permanent Redirect",
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    411: "Length Required",
    412: "Precondition Failed",
    413: "Payload Too Large",
    414: "URI Too Long",
    415: "Unsupported Media Type",
    416: "Range Not Satisfiable",
    417: "Expectation Failed",
    418: "I'm a teapot",
    421: "Misdirected Request",
    422: "Unprocessable Entity",
    423: "Locked",
    424: "Failed Dependency",
    425: "Too Early",
    426: "Upgrade Required",
    428: "Precondition Required",
    429: "Too Many Requests",
    431: "Request Header Fields Too Large",
    451: "Unavailable For Legal Reasons",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
    505: "HTTP Version Not Supported",
    506: "Variant Also Negotiates",
    507: "Insufficient Storage",
    508: "Loop Detected",
    510: "Not Extended",
    511: "Network Authentication Required",
}

# ---------------------------------------------------------------------------
# Role-based permission mapping
# Extend this as the permission model grows.
# ---------------------------------------------------------------------------
ROLE_PERMISSIONS = {
    "admin": [
        "create_user",
        "delete_user",
        "update_user",
        "view_user",
        "create_role",
        "delete_role",
        "update_role",
        "view_role",
        "manage_billing",
        "view_analytics",
        "export_data"
    ],
    "manager": [
        "create_user",
        "update_user",
        "view_user",
        "view_role",
        "view_analytics",
        "export_data"
    ],
    "user": [
        "view_user",
        "update_self"
    ],
    "guest": [
        "view_public_info"
    ]
}

# ---------------------------------------------------------------------------
# Default headers to attach to outbound service-to-service requests
# ---------------------------------------------------------------------------
COMMON_HEADERS = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache"
}


class AnalyticsEngineMock:
    """
    A mock class to simulate an analytics engine processing.
    """
    def __init__(self):
        self.started = False
        self.data_points = []
    
    def start(self):
        self.started = True
    
    def stop(self):
        self.started = False
        
    def process_data(self, data):
        if not self.started:
            raise ValueError("Engine not started")
        self.data_points.extend(data)
        
    def get_summary(self):
        return {
            "total_points": len(self.data_points),
            "status": "running" if self.started else "stopped"
        }

# =================================================================================================
# Additional generic utility functions and configurations for the Accessor ecosystem
# =================================================================================================

def calculate_system_load(cpu_times: tuple) -> float:
    """Calculate system load based on CPU times."""
    return sum(cpu_times) / len(cpu_times) if cpu_times else 0.0

DEFAULT_RETRY_BACKOFF_FACTORS = [0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
MAX_RETRIES = len(DEFAULT_RETRY_BACKOFF_FACTORS)

def exponential_backoff_sleep(attempt: int) -> float:
    """Calculate sleep time for exponential backoff."""
    if attempt >= MAX_RETRIES:
        attempt = MAX_RETRIES - 1
    return DEFAULT_RETRY_BACKOFF_FACTORS[attempt]

SYSTEM_METRICS_SCHEMA = {
    "type": "object",
    "properties": {
        "cpu_usage": {"type": "number"},
        "memory_usage": {"type": "number"},
        "disk_io": {"type": "number"},
        "network_io": {"type": "number"}
    },
    "required": ["cpu_usage", "memory_usage"]
}

