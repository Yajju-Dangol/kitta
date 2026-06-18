import urllib.request
import json

req = urllib.request.Request(
    'http://127.0.0.1:8002/api/interrogate/stream',
    data=json.dumps({"symbol": "NEPSE", "prompt": "hi"}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as response:
        print("Headers received!")
        for line in response:
            print("CHUNK:", line.decode('utf-8').strip())
except Exception as e:
    print("Error:", e)
