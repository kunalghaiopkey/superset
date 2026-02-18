# 🔐 Keycloak Backend Authentication for Superset

> **Complete solution for authenticating with Superset APIs using Keycloak tokens from your backend services**

---

## 📦 What You Get

This solution enables your backend services to:
- ✅ Authenticate with Superset using **Keycloak access tokens**
- ✅ **Auto-create users** from Keycloak user profiles
- ✅ **Map Keycloak roles** to Superset roles
- ✅ Get **session cookies** for API calls
- ✅ Call **any Superset REST API** from your backend
- ✅ Integrate with **cache warmup** and other Superset features

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `superset/views/keycloak_auth.py` | Main authentication endpoint (✅ registered) |
| `KEYCLOAK_AUTH_QUICKSTART.md` | **START HERE** - Quick start guide |
| `keycloak_config_example.py` | Configuration templates |
| `test_keycloak_auth.py` | Test script |

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Add Configuration

Copy from `keycloak_config_example.py` to your `superset_config.py`:

```python
KEYCLOAK_CONFIG = {
    "server_url": "https://your-keycloak.com",
    "realm": "your-realm",
    "client_id": "superset-client",
}
KEYCLOAK_SKIP_TOKEN_VERIFICATION = True  # False for production
KEYCLOAK_AUTO_CREATE_USER = True
```

### Step 2: Install Dependencies

```bash
pip install PyJWT requests
```

### Step 3: Restart Superset

```bash
superset run -p 8088
```

---

## 💡 Simple Example

```python
import requests

# Your Keycloak token
token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

# 1. Authenticate
response = requests.post(
    "http://localhost:8088/api/v1/keycloak_auth/token_login",
    json={"access_token": token}
)

# 2. Get session
session_cookie = response.json()["session_cookie"]

# 3. Call APIs
headers = {"Cookie": f"session={session_cookie}"}
dashboards = requests.get(
    "http://localhost:8088/api/v1/dashboard/",
    headers=headers
)
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[KEYCLOAK_AUTH_QUICKSTART.md](KEYCLOAK_AUTH_QUICKSTART.md)** | 👈 **Start here** - Complete guide with examples |
| **[keycloak_config_example.py](keycloak_config_example.py)** | Configuration options and examples |
| **[test_keycloak_auth.py](test_keycloak_auth.py)** | Test your setup |

---

## 🔌 API Endpoints

### POST /api/v1/keycloak_auth/token_login
Exchange Keycloak token for Superset session cookie

**Request:**
```json
{
  "access_token": "your-keycloak-token",
  "user_profile": {
    "email": "user@example.com",
    "preferred_username": "john.doe"
  }
}
```

**Response:**
```json
{
  "session_cookie": "session-value",
  "user": {
    "username": "john.doe",
    "roles": ["Gamma"]
  }
}
```

### POST /api/v1/keycloak_auth/validate_session
Check if session is valid

---

## 🧪 Test Your Setup

```bash
# Run the test script
python test_keycloak_auth.py
```

Or test manually:
```bash
curl -X POST http://localhost:8088/api/v1/keycloak_auth/token_login \
  -H "Content-Type: application/json" \
  -d '{"access_token": "your-token"}'
```

---

## 🎯 Use Cases

### 1. Backend Service Integration
```python
class AnalyticsService:
    def __init__(self, keycloak_token):
        self.token = keycloak_token
        self.session = self._authenticate()
    
    def get_sales_data(self):
        response = requests.get(
            "http://superset/api/v1/chart/123/data/",
            headers={"Cookie": f"session={self.session}"}
        )
        return response.json()
```

### 2. Scheduled Reports
```python
def daily_report(keycloak_token):
    # Authenticate
    auth = requests.post(
        "http://superset/api/v1/keycloak_auth/token_login",
        json={"access_token": keycloak_token}
    )
    session = auth.json()["session_cookie"]
    
    # Get data and send report
    data = get_chart_data(session, chart_id=456)
    send_email_report(data)
```

### 3. Cache Warmup
```python
def warmup_charts(keycloak_token, chart_ids):
    auth = requests.post(
        "http://superset/api/v1/keycloak_auth/token_login",
        json={"access_token": keycloak_token}
    )
    session = auth.json()["session_cookie"]
    
    for chart_id in chart_ids:
        requests.put(
            "http://superset/api/v1/chart/warm_up_cache",
            json={"chart_id": chart_id},
            headers={"Cookie": f"session={session}"}
        )
```

---

## 🔒 Security

### Development Mode
```python
KEYCLOAK_SKIP_TOKEN_VERIFICATION = True  # Skip verification
```
Use when backend is fully trusted

### Production Mode (Recommended)
```python
KEYCLOAK_SKIP_TOKEN_VERIFICATION = False  # Verify with Keycloak
KEYCLOAK_CONFIG = {
    "server_url": "https://keycloak.prod.com",
    "realm": "production",
    "client_id": "superset-prod",
}
```
Verifies token signature with Keycloak

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "access_token is required" | Include `access_token` in request body |
| "Invalid token" | Set `KEYCLOAK_SKIP_TOKEN_VERIFICATION = True` for testing |
| "Failed to create user" | Enable `KEYCLOAK_AUTO_CREATE_USER = True` |
| Session not working | Include `Cookie: session=<value>` in headers |
| Connection refused | Verify Superset is running on specified URL |

---

## 📖 How It Works

```
1. Your Backend Service
   │
   ├─> Has Keycloak Token
   │
   ├─> POST /api/v1/keycloak_auth/token_login
   │   {access_token: "..."}
   │
   ├─> Superset validates token
   │   ├─> Checks with Keycloak (if verification enabled)
   │   ├─> Gets/creates user
   │   └─> Creates session
   │
   ├─> Returns session_cookie
   │
   └─> Use cookie for all API calls
       Cookie: session=<value>
```

---

## 🎓 Next Steps

1. ✅ **Read** [KEYCLOAK_AUTH_QUICKSTART.md](KEYCLOAK_AUTH_QUICKSTART.md)
2. 🔧 **Configure** using [keycloak_config_example.py](keycloak_config_example.py)
3. 🧪 **Test** with [test_keycloak_auth.py](test_keycloak_auth.py)
4. 🚀 **Integrate** into your backend service
5. 📊 **Monitor** logs and usage

---

## 💬 Support

- **API Docs**: http://localhost:8088/swagger/v1
- **Configuration**: See `keycloak_config_example.py`
- **Examples**: See `KEYCLOAK_AUTH_QUICKSTART.md`
- **Test**: Run `test_keycloak_auth.py`

---

## ✨ Summary

You can now:
- ✅ Use Keycloak tokens to authenticate with Superset
- ✅ Call Superset APIs from your backend services
- ✅ Auto-create and manage users from Keycloak
- ✅ Map roles between Keycloak and Superset
- ✅ Build custom integrations and automations

**Get started with [KEYCLOAK_AUTH_QUICKSTART.md](KEYCLOAK_AUTH_QUICKSTART.md)** 🚀

---

**Created**: February 2026  
**Version**: 1.0  
**License**: Apache 2.0
