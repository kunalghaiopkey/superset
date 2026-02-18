# 🚀 Keycloak Backend Authentication - Quick Start

## Complete Solution for Using Keycloak Tokens with Superset APIs

This guide shows you how to use your **Keycloak token** and **user profile** to authenticate with Superset APIs from your backend service.

---

## ✅ What's Been Created

1. **New API Endpoint**: `superset/views/keycloak_auth.py`
   - ✅ Already registered in initialization
   - Validates Keycloak tokens
   - Creates Superset sessions
   - Returns session cookies for API calls

2. **Two Endpoints Available**:
   - `POST /api/v1/keycloak_auth/token_login` - Get session from token
   - `POST /api/v1/keycloak_auth/validate_session` - Check session validity

---

## 🔧 Setup (3 Steps)

### Step 1: Configure Superset

Add to your `superset_config.py`:

```python
# Keycloak Configuration
KEYCLOAK_CONFIG = {
    "server_url": "https://your-keycloak-domain.com",  # Your Keycloak server
    "realm": "your-realm-name",                        # Your realm
    "client_id": "superset-client",                    # Your client ID
}

# Token Verification (use True only for dev/testing with trusted backend)
KEYCLOAK_SKIP_TOKEN_VERIFICATION = True  # False for production

# Auto-create users from Keycloak tokens
KEYCLOAK_AUTO_CREATE_USER = True

# Map Keycloak roles to Superset roles (optional)
KEYCLOAK_ROLE_MAPPING = {
    "superset_admin": ["Admin"],
    "superset_alpha": ["Alpha"],
    "superset_gamma": ["Gamma"],
}

# Default role for new users
AUTH_USER_REGISTRATION_ROLE = "Gamma"
```

### Step 2: Install Dependencies

```bash
pip install PyJWT requests
```

### Step 3: Restart Superset

```bash
superset run -p 8088 --with-threads --reload --debugger
```

---

## 💻 Usage Examples

### Example 1: Simple Python Request

```python
import requests

# Your Keycloak token and user info
keycloak_token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

# Step 1: Authenticate with Superset
auth_response = requests.post(
    "http://localhost:8088/api/v1/keycloak_auth/token_login",
    json={
        "access_token": keycloak_token,
        "user_profile": {  # Optional if not in token
            "email": "user@example.com",
            "preferred_username": "john.doe",
            "given_name": "John",
            "family_name": "Doe"
        }
    }
)

# Step 2: Get session cookie
data = auth_response.json()
session_cookie = data["session_cookie"]
print(f"✓ Logged in as: {data['user']['username']}")

# Step 3: Make API calls
headers = {"Cookie": f"session={session_cookie}"}

# Get dashboards
dashboards = requests.get(
    "http://localhost:8088/api/v1/dashboard/",
    headers=headers
)
print(f"✓ Found {dashboards.json()['count']} dashboards")

# Get chart data
chart_data = requests.get(
    "http://localhost:8088/api/v1/chart/123/data/",
    headers=headers
)
print(f"✓ Retrieved chart data")
```

### Example 2: Reusable Client Class

```python
import requests

class SupersetKeycloakClient:
    def __init__(self, superset_url, keycloak_token):
        self.superset_url = superset_url.rstrip('/')
        self.token = keycloak_token
        self.session_cookie = None
        self.user = None
    
    def authenticate(self, user_profile=None):
        """Authenticate and get session"""
        url = f"{self.superset_url}/api/v1/keycloak_auth/token_login"
        payload = {"access_token": self.token}
        
        if user_profile:
            payload["user_profile"] = user_profile
        
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            self.session_cookie = data["session_cookie"]
            self.user = data["user"]
            print(f"✓ Authenticated as: {self.user['username']}")
            return True
        else:
            print(f"✗ Authentication failed: {response.text}")
            return False
    
    def get_headers(self):
        """Get headers for API calls"""
        return {"Cookie": f"session={self.session_cookie}"}
    
    def get_dashboards(self):
        """Get all dashboards"""
        url = f"{self.superset_url}/api/v1/dashboard/"
        response = requests.get(url, headers=self.get_headers())
        return response.json()
    
    def get_chart_data(self, chart_id):
        """Get chart data"""
        url = f"{self.superset_url}/api/v1/chart/{chart_id}/data/"
        response = requests.get(url, headers=self.get_headers())
        return response.json()
    
    def warm_up_cache(self, chart_id, dashboard_id=None):
        """Warm up chart cache"""
        url = f"{self.superset_url}/api/v1/chart/warm_up_cache"
        payload = {"chart_id": chart_id}
        if dashboard_id:
            payload["dashboard_id"] = dashboard_id
        
        response = requests.put(url, json=payload, headers=self.get_headers())
        return response.json()

# Usage
client = SupersetKeycloakClient(
    "http://localhost:8088",
    "your-keycloak-token"
)

if client.authenticate():
    dashboards = client.get_dashboards()
    print(f"Found {dashboards['count']} dashboards")
```

### Example 3: Integration with Cache Warmup

```python
def warmup_chart_with_keycloak(chart_id, keycloak_token):
    """Warm up a chart using Keycloak authentication"""
    
    client = SupersetKeycloakClient(
        "http://localhost:8088",
        keycloak_token
    )
    
    if client.authenticate():
        result = client.warm_up_cache(chart_id)
        print(f"✓ Cache warmed up: {result}")
        return result
    else:
        raise Exception("Authentication failed")

# Use it
warmup_chart_with_keycloak(
    chart_id=123,
    keycloak_token="your-keycloak-token"
)
```

### Example 4: Scheduled Backend Job

```python
import schedule
import time

def scheduled_analytics_pull():
    """Pull analytics data from Superset periodically"""
    
    # Get Keycloak token from your auth service
    keycloak_token = get_keycloak_token()  # Your method
    
    # Authenticate with Superset
    client = SupersetKeycloakClient("http://localhost:8088", keycloak_token)
    
    if client.authenticate():
        # Fetch data from multiple charts
        sales_data = client.get_chart_data(101)
        revenue_data = client.get_chart_data(102)
        
        # Process and store data
        process_analytics(sales_data, revenue_data)
        print("✓ Analytics data updated")

# Schedule to run every hour
schedule.every().hour.do(scheduled_analytics_pull)

while True:
    schedule.run_pending()
    time.sleep(60)
```

---

## 🔒 Security Notes

### Development Mode (Trusted Backend)
```python
# Use this when your backend service is completely trusted
# and you don't need to verify token signatures
KEYCLOAK_SKIP_TOKEN_VERIFICATION = True
```

⚠️ **Only use this in development or with fully trusted backend services**

### Production Mode (Recommended)
```python
# Properly verify tokens with Keycloak
KEYCLOAK_SKIP_TOKEN_VERIFICATION = False

KEYCLOAK_CONFIG = {
    "server_url": "https://keycloak.production.com",
    "realm": "production",
    "client_id": "superset-prod",
}
```

This will:
- Fetch Keycloak's public key
- Verify token signature
- Verify token expiration
- Verify audience claim

---

## 📋 API Reference

### POST /api/v1/keycloak_auth/token_login

**Request:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_profile": {
    "email": "user@example.com",
    "preferred_username": "john.doe",
    "given_name": "John",
    "family_name": "Doe"
  }
}
```

**Response (200 OK):**
```json
{
  "session_cookie": "eyJfZnJlc2giOmZhbHNl...",
  "csrf_token": "IjYwZDdjYzVhYmY2ZGI4ZGJi...",
  "user": {
    "id": 1,
    "username": "john.doe",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "roles": ["Gamma"]
  }
}
```

### POST /api/v1/keycloak_auth/validate_session

**Request:**
```json
{
  "session_cookie": "eyJfZnJlc2giOmZhbHNl..."
}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "john.doe",
    "email": "user@example.com"
  }
}
```

---

## 🐛 Troubleshooting

### "access_token is required"
**Solution:** Make sure you're sending `access_token` in the request body:
```python
{"access_token": "your-token"}
```

### "Invalid token" or "Token has expired"
**Solutions:**
1. Check token expiry: Token might be expired
2. For dev/testing: Set `KEYCLOAK_SKIP_TOKEN_VERIFICATION = True`
3. For production: Ensure `KEYCLOAK_CONFIG` matches your Keycloak setup

### "Failed to create or retrieve user"
**Solutions:**
1. Enable auto-creation: `KEYCLOAK_AUTO_CREATE_USER = True`
2. Check default role exists: `AUTH_USER_REGISTRATION_ROLE = "Gamma"`
3. Ensure token contains `email` or `preferred_username`

### Session cookie not working in API calls
**Solutions:**
1. Include cookie in headers: `{"Cookie": "session=<cookie_value>"}`
2. Verify you're using the correct session cookie value
3. Check if session has expired (default: 24 hours)

---

## 🎯 Common Use Cases

### 1. Microservice Integration
```python
# Service A: Has Keycloak token
# Service B: Needs Superset data

def get_superset_analytics(keycloak_token):
    client = SupersetKeycloakClient("http://superset", keycloak_token)
    client.authenticate()
    return client.get_chart_data(123)
```

### 2. Scheduled Reports
```python
def send_daily_report(keycloak_token):
    client = SupersetKeycloakClient("http://superset", keycloak_token)
    client.authenticate()
    
    # Warm up cache first
    client.warm_up_cache(chart_id=456)
    
    # Get data
    data = client.get_chart_data(456)
    
    # Send email report
    send_email_report(data)
```

### 3. Real-time Dashboard Updates
```python
def update_external_dashboard(keycloak_token):
    client = SupersetKeycloakClient("http://superset", keycloak_token)
    client.authenticate()
    
    # Fetch multiple charts
    chart_1 = client.get_chart_data(101)
    chart_2 = client.get_chart_data(102)
    
    # Push to external system
    external_api.update_dashboard(chart_1, chart_2)
```

---

## 📊 Test Your Setup

```bash
# Test authentication endpoint
curl -X POST http://localhost:8088/api/v1/keycloak_auth/token_login \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "your-keycloak-token",
    "user_profile": {
      "email": "test@example.com",
      "preferred_username": "testuser"
    }
  }'
```

Expected response:
```json
{
  "session_cookie": "...",
  "user": {
    "username": "testuser",
    "email": "test@example.com",
    "roles": ["Gamma"]
  }
}
```

---

## 📚 Next Steps

1. ✅ **Setup Complete** - Configuration added, API registered
2. 🔑 **Get Your Token** - Obtain Keycloak access token from your auth service
3. 🧪 **Test** - Use the examples above to test authentication
4. 🚀 **Integrate** - Add to your backend service
5. 📊 **Monitor** - Check Superset logs for any issues

---

## 🎉 You're Ready!

You can now:
- ✅ Authenticate with Keycloak tokens
- ✅ Call any Superset API from your backend
- ✅ Auto-create users from Keycloak profiles
- ✅ Map Keycloak roles to Superset roles
- ✅ Warm up caches programmatically
- ✅ Build custom integrations

For more details, check Superset's API documentation at:
**http://localhost:8088/swagger/v1**

Happy building! 🚀
