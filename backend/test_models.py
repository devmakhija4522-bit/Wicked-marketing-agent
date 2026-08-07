import os
from google import genai
from google.genai import types

client = genai.Client(api_key="AQ.Ab8RN6IOUg55LgU5o0CXkS2TnTbWAHSyLlbdGlobbd1-2giFNA")
print("Models available:")
try:
    for m in client.models.list():
        if 'flash' in m.name or 'pro' in m.name:
            print(m.name)
except Exception as e:
    print(f"Error listing models: {e}")

try:
    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents="Hello"
    )
    print("gemini-1.5-flash works!")
except Exception as e:
    print(f"gemini-1.5-flash failed: {e}")

try:
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents="Hello"
    )
    print("gemini-2.0-flash works!")
except Exception as e:
    print(f"gemini-2.0-flash failed: {e}")
