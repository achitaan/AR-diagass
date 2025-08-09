import requests
import json

def test_api():
    base_urls = [
        "http://localhost:8000",
        "http://127.0.0.1:8000", 
        "http://10.0.2.2:8000"
    ]
    
    endpoints = [
        "/",
        "/health", 
        "/docs",
        "/chat/simple"
    ]
    
    for base_url in base_urls:
        print(f"\n=== Testing {base_url} ===")
        
        # Test GET endpoints
        for endpoint in ["/", "/health", "/docs"]:
            try:
                response = requests.get(f"{base_url}{endpoint}", timeout=5)
                print(f"✅ GET {endpoint}: {response.status_code}")
                if endpoint != "/docs":  # docs returns HTML
                    print(f"   Response: {response.text[:100]}...")
            except Exception as e:
                print(f"❌ GET {endpoint}: {str(e)}")
        
        # Test POST chat endpoint
        try:
            headers = {'Content-Type': 'application/json'}
            data = {'message': 'test'}
            response = requests.post(f"{base_url}/chat/simple", 
                                   headers=headers, 
                                   json=data, 
                                   timeout=5)
            print(f"✅ POST /chat/simple: {response.status_code}")
            print(f"   Response: {response.text[:100]}...")
        except Exception as e:
            print(f"❌ POST /chat/simple: {str(e)}")

if __name__ == "__main__":
    test_api()
