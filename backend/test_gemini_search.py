import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load env
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: No GEMINI_API_KEY in .env")
    sys.exit(1)

client = genai.Client(api_key=api_key)

try:
    print("Testing without search...")
    response1 = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="What is the weather in Tokyo today?"
    )
    print("Response 1:", response1.text)

    print("\nTesting WITH search...")
    response2 = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="What is the exact current weather in Tokyo today?",
        config=types.GenerateContentConfig(
            tools=[{"google_search": {}}]
        )
    )
    print("Response 2:", response2.text)
except Exception as e:
    import traceback
    print("Exception!")
    traceback.print_exc()
