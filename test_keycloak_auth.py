"""
Test script for Keycloak authentication with Superset

This script tests the Keycloak token authentication endpoint.
Run this after configuring Superset with Keycloak settings.
"""

import requests
import json


def test_keycloak_auth():
    """Test the Keycloak authentication endpoint"""
    
    # Configuration
    SUPERSET_URL = "http://localhost:8088"
    
    # Your Keycloak token (replace with actual token)
    KEYCLOAK_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    
    # User profile (optional if already in token)
    USER_PROFILE = {
        "email": "test@example.com",
        "preferred_username": "testuser",
        "given_name": "Test",
        "family_name": "User"
    }
    
    print("=" * 80)
    print("KEYCLOAK AUTHENTICATION TEST")
    print("=" * 80)
    
    # Test 1: Authenticate with token
    print("\n[Test 1] Authenticating with Keycloak token...")
    try:
        response = requests.post(
            f"{SUPERSET_URL}/api/v1/keycloak_auth/token_login",
            json={
                "access_token": KEYCLOAK_TOKEN,
                "user_profile": USER_PROFILE
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            session_cookie = data.get("session_cookie")
            user = data.get("user", {})
            
            print("✓ Authentication successful!")
            print(f"  Username: {user.get('username')}")
            print(f"  Email: {user.get('email')}")
            print(f"  Roles: {', '.join(user.get('roles', []))}")
            print(f"  Session cookie: {session_cookie[:50]}...")
            
            # Test 2: Use session to call API
            print("\n[Test 2] Testing session with API call...")
            headers = {"Cookie": f"session={session_cookie}"}
            
            api_response = requests.get(
                f"{SUPERSET_URL}/api/v1/dashboard/",
                headers=headers,
                timeout=30
            )
            
            print(f"Status Code: {api_response.status_code}")
            
            if api_response.status_code == 200:
                api_data = api_response.json()
                count = api_data.get("count", 0)
                print(f"✓ API call successful!")
                print(f"  Found {count} dashboards")
            else:
                print(f"✗ API call failed")
                print(f"  Response: {api_response.text[:200]}")
            
            # Test 3: Validate session
            print("\n[Test 3] Validating session...")
            validate_response = requests.post(
                f"{SUPERSET_URL}/api/v1/keycloak_auth/validate_session",
                json={"session_cookie": session_cookie},
                headers=headers,
                timeout=30
            )
            
            print(f"Status Code: {validate_response.status_code}")
            
            if validate_response.status_code == 200:
                print("✓ Session is valid")
            else:
                print(f"✗ Session validation failed")
            
        else:
            print(f"✗ Authentication failed")
            print(f"  Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to Superset")
        print(f"  Make sure Superset is running at {SUPERSET_URL}")
    except requests.exceptions.Timeout:
        print("✗ Request timed out")
    except Exception as e:
        print(f"✗ Error: {str(e)}")
    
    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)


def test_with_real_token():
    """Interactive test with user-provided token"""
    
    print("\n" + "=" * 80)
    print("INTERACTIVE TEST")
    print("=" * 80)
    
    superset_url = input("\nEnter Superset URL [http://localhost:8088]: ").strip()
    if not superset_url:
        superset_url = "http://localhost:8088"
    
    print("\nEnter your Keycloak access token:")
    keycloak_token = input().strip()
    
    if not keycloak_token:
        print("✗ Token is required")
        return
    
    print("\nProvide user profile (optional, press Enter to skip):")
    email = input("Email: ").strip()
    username = input("Username: ").strip()
    first_name = input("First name: ").strip()
    last_name = input("Last name: ").strip()
    
    user_profile = {}
    if email:
        user_profile["email"] = email
    if username:
        user_profile["preferred_username"] = username
    if first_name:
        user_profile["given_name"] = first_name
    if last_name:
        user_profile["family_name"] = last_name
    
    print("\n[Authenticating...]")
    
    try:
        payload = {"access_token": keycloak_token}
        if user_profile:
            payload["user_profile"] = user_profile
        
        response = requests.post(
            f"{superset_url}/api/v1/keycloak_auth/token_login",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n" + "=" * 80)
            print("✓ SUCCESS!")
            print("=" * 80)
            print("\nResponse:")
            print(json.dumps(data, indent=2))
            
            session_cookie = data.get("session_cookie")
            print(f"\nSession Cookie: {session_cookie}")
            print(f"\nUse this in your requests:")
            print(f'headers = {{"Cookie": "session={session_cookie}"}}')
            
        else:
            print("\n" + "=" * 80)
            print("✗ FAILED")
            print("=" * 80)
            print(f"\nResponse: {response.text}")
            
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")


def main():
    """Main function"""
    
    print("\n" + "=" * 80)
    print("SUPERSET KEYCLOAK AUTHENTICATION TESTER")
    print("=" * 80)
    print("\nOptions:")
    print("  1. Run automated test (requires editing token in script)")
    print("  2. Interactive test (provide token interactively)")
    print("  3. Exit")
    
    choice = input("\nSelect option [1-3]: ").strip()
    
    if choice == "1":
        test_keycloak_auth()
    elif choice == "2":
        test_with_real_token()
    elif choice == "3":
        print("Goodbye!")
    else:
        print("Invalid option")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
