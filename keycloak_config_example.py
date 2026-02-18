# ==============================================================================
# KEYCLOAK BACKEND AUTHENTICATION CONFIGURATION
# ==============================================================================
# Add this to your superset_config.py file

# ------------------------------------------------------------------------------
# Keycloak Server Configuration
# ------------------------------------------------------------------------------
KEYCLOAK_CONFIG = {
    # Your Keycloak server URL (without trailing slash)
    "server_url": "https://your-keycloak-domain.com",
    
    # Your Keycloak realm name
    "realm": "your-realm-name",
    
    # Your Superset client ID in Keycloak
    "client_id": "superset-client",
}

# ------------------------------------------------------------------------------
# Token Verification Settings
# ------------------------------------------------------------------------------
# Set to True ONLY for development or when tokens come from a FULLY TRUSTED backend
# Set to False for production to properly verify token signatures with Keycloak
KEYCLOAK_SKIP_TOKEN_VERIFICATION = True  # Change to False in production

# ------------------------------------------------------------------------------
# User Auto-Creation
# ------------------------------------------------------------------------------
# Automatically create Superset users from Keycloak tokens
KEYCLOAK_AUTO_CREATE_USER = True

# ------------------------------------------------------------------------------
# Role Mapping (Optional)
# ------------------------------------------------------------------------------
# Map Keycloak roles to Superset roles
# Format: {"keycloak_role": ["Superset Role"]}
KEYCLOAK_ROLE_MAPPING = {
    # Example mappings - customize based on your Keycloak roles
    "superset_admin": ["Admin"],
    "superset_alpha": ["Alpha"],
    "superset_gamma": ["Gamma"],
    "data_analyst": ["Alpha"],
    "viewer": ["Gamma"],
}

# ------------------------------------------------------------------------------
# Default User Settings
# ------------------------------------------------------------------------------
# Default role assigned to new users (if no role mapping matches)
AUTH_USER_REGISTRATION_ROLE = "Gamma"  # Options: "Admin", "Alpha", "Gamma", "Public"

# ==============================================================================
# EXAMPLE CONFIGURATIONS FOR DIFFERENT SCENARIOS
# ==============================================================================

# -------------------------
# Development Environment
# -------------------------
"""
KEYCLOAK_CONFIG = {
    "server_url": "http://localhost:8080",
    "realm": "dev-realm",
    "client_id": "superset-dev",
}
KEYCLOAK_SKIP_TOKEN_VERIFICATION = True
KEYCLOAK_AUTO_CREATE_USER = True
"""

# -------------------------
# Production Environment
# -------------------------
"""
KEYCLOAK_CONFIG = {
    "server_url": "https://keycloak.production.com",
    "realm": "production",
    "client_id": "superset-prod",
}
KEYCLOAK_SKIP_TOKEN_VERIFICATION = False  # Always verify in production
KEYCLOAK_AUTO_CREATE_USER = True
KEYCLOAK_ROLE_MAPPING = {
    "admin_role": ["Admin"],
    "analyst_role": ["Alpha"],
    "viewer_role": ["Gamma"],
}
"""

# -------------------------
# Strict Security Setup
# -------------------------
"""
KEYCLOAK_CONFIG = {
    "server_url": "https://secure-keycloak.company.com",
    "realm": "secure-realm",
    "client_id": "superset-secure",
}
KEYCLOAK_SKIP_TOKEN_VERIFICATION = False
KEYCLOAK_AUTO_CREATE_USER = False  # Don't auto-create, users must pre-exist
"""

# ==============================================================================
# NOTES
# ==============================================================================
"""
1. Token Verification:
   - When KEYCLOAK_SKIP_TOKEN_VERIFICATION = True:
     * Token signature is NOT verified
     * Use ONLY when token source is completely trusted
     * Faster but less secure
   
   - When KEYCLOAK_SKIP_TOKEN_VERIFICATION = False:
     * Token signature IS verified with Keycloak
     * Fetches public key from Keycloak server
     * Verifies expiration and audience
     * Recommended for production

2. Role Mapping:
   - Roles from token path: realm_access.roles
   - Multiple Superset roles can be assigned per Keycloak role
   - If no mapping matches, default role is used

3. User Information:
   - Extracted from token claims:
     * email (required)
     * preferred_username (required if no email)
     * given_name (optional, for first_name)
     * family_name (optional, for last_name)
   
   - Can also be provided in API call via user_profile parameter

4. Session Management:
   - Sessions use Flask's default session management
   - Session cookies typically expire after 24 hours of inactivity
   - Can be configured via PERMANENT_SESSION_LIFETIME

5. Security Best Practices:
   - Always use HTTPS in production
   - Rotate Keycloak client secrets regularly
   - Set KEYCLOAK_SKIP_TOKEN_VERIFICATION = False in production
   - Use role mapping to enforce least-privilege access
   - Monitor authentication logs for suspicious activity
"""
