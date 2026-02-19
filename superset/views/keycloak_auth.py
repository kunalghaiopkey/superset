# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

"""
Custom Keycloak token authentication endpoint for backend-to-backend communication
"""

import logging
from typing import Any

import jwt
import requests
from flask import current_app, request, Response, session
from flask_appbuilder.api import BaseApi, expose, safe
from flask_login import login_user
from werkzeug.http import parse_cookie

from superset import security_manager
from superset.extensions import db

logger = logging.getLogger(__name__)


class KeycloakAuthApi(BaseApi):
    """
    API endpoint for backend services to authenticate with Keycloak token
    and get Superset session cookies
    """

    resource_name = "keycloak_auth"
    allow_browser_login = True
    openapi_spec_tag = "Keycloak Authentication"

    @expose("/token_login", methods=["POST"])
    @safe
    def token_login(self) -> Response:
        """
        Authenticate using Keycloak access token and get Superset session cookies.
        ---
        post:
          summary: Login with Keycloak token
          description: >-
            Accepts a Keycloak access token, validates it, creates/updates user,
            and returns session cookies for making authenticated API calls to Superset.
          requestBody:
            required: true
            content:
              application/json:
                schema:
                  type: object
                  required:
                    - access_token
                  properties:
                    access_token:
                      type: string
                      description: Keycloak access token (JWT)
                    user_profile:
                      type: object
                      description: Optional user profile from Keycloak (if not in token)
                      properties:
                        email:
                          type: string
                        preferred_username:
                          type: string
                        given_name:
                          type: string
                        family_name:
                          type: string
          responses:
            200:
              description: Successfully authenticated
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      session_cookie:
                        type: string
                        description: Session cookie value
                      csrf_token:
                        type: string
                        description: CSRF token for API requests
                      user:
                        type: object
                        description: User information
            400:
              description: Bad request (missing or invalid token)
            401:
              description: Unauthorized (invalid token)
            500:
              description: Server error
        """
        try:
            data = request.json or {}
            access_token = data.get("access_token")
            user_profile_override = data.get("user_profile", {})


            logger.info("=== Token Login Attempt ===")
            logger.info(f"Request data keys: {list(data.keys())}")
            logger.info(f"Access token present: {bool(access_token)}")
            if access_token:
                logger.info(f"Token length: {len(access_token)}")
                logger.info(f"Token prefix: {access_token[:50]}...")

            if not access_token:
                logger.error("No access_token in request")
                return self.response_400(message="access_token is required")

            # Validate and decode Keycloak token
            logger.info("Starting token validation...")
            user_info = self._validate_keycloak_token(access_token)
            if not user_info:
                logger.error("Token validation returned None")
                return self.response_401(message="Token validation failed")

            # Merge with any provided user profile
            user_info.update(user_profile_override)

            # Get or create Superset user
            user = self._get_or_create_user(user_info)
            if not user:
                return self.response(
                    500, message="Failed to create or retrieve user"
                )

            # Create session and get cookies
            session_data = self._create_session_for_user(user)

            return self.response(
                200,
                session_cookie=session_data["session"],
                csrf_token=session_data.get("csrf_token", ""),
                user={
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "roles": [role.name for role in user.roles],
                },
            )

        except jwt.ExpiredSignatureError:
            logger.warning("Expired Keycloak token")
            return self.response_401(message="Token has expired")
        except jwt.InvalidTokenError as e:
            logger.warning("Invalid Keycloak token: %s", str(e))
            return self.response_401(message="Invalid token")
        except Exception as e:
            logger.exception("Error during token login")
            return self.response(500, message=str(e))

    def _validate_keycloak_token(self, access_token: str) -> dict[str, Any] | None:
        """
        Validate Keycloak access token and extract user information.
        
        Returns user info dict or None if invalid.
        """
        try:
            # Option 1: Skip verification if configured (for development/testing)
            if current_app.config.get("KEYCLOAK_SKIP_TOKEN_VERIFICATION", False):
                logger.warning(
                    "Skipping Keycloak token verification - USE ONLY IN DEVELOPMENT"
                )
                decoded = jwt.decode(
                    access_token,
                    options={"verify_signature": False},
                )
                logger.info(f"Token decoded (no verification). Username: {decoded.get('preferred_username')}")
                return decoded
           
            # Option 2: Get Keycloak config from OAUTH_PROVIDERS
            oauth_providers = current_app.config.get("OAUTH_PROVIDERS", [])
            keycloak_provider = next(
                (cfg for cfg in oauth_providers if cfg.get("name") == "keycloak"),
                None
            )
            
            if not keycloak_provider:
                logger.error("Keycloak provider not found in OAUTH_PROVIDERS")
                # Fallback to unverified decode
                logger.warning("Falling back to unverified token decode")
                decoded = jwt.decode(
                    access_token,
                    options={"verify_signature": False},
                )
                return decoded
            
            # Get api_base_url from remote_app config
            remote_app = keycloak_provider.get("remote_app", {})
            api_base_url = remote_app.get("api_base_url", "")
            
            if not api_base_url:
                logger.error("api_base_url not configured in Keycloak provider")
                # Fallback to unverified decode
                logger.warning("Falling back to unverified token decode")
                decoded = jwt.decode(
                    access_token,
                    options={"verify_signature": False},
                )
                return decoded

            # Fetch and verify with JWKS
            jwks_url = f"{api_base_url}openid-connect/certs"
            logger.info(f"Fetching JWKS from: {jwks_url}")
            
            try:
                jwk_client = jwt.PyJWKClient(jwks_url)
                signing_key = jwk_client.get_signing_key_from_jwt(access_token)
                
                # Decode with verification
                decoded = jwt.decode(
                    access_token,
                    signing_key.key,
                    algorithms=["RS256"],
                    options={
                        "verify_signature": True,
                        "verify_exp": True,
                        "verify_aud": False  # Disable audience verification by default
                    },
                )
                logger.info(f"Token validated successfully. Username: {decoded.get('preferred_username')}")
                return decoded
                
            except jwt.InvalidTokenError as e:
                logger.error(f"JWT validation failed: {str(e)}")
                logger.info("Attempting unverified decode to extract claims...")
                # Try to decode without verification to see what's in the token
                decoded = jwt.decode(
                    access_token,
                    options={"verify_signature": False},
                )
                logger.warning(f"Token decoded without verification. Claims: {list(decoded.keys())}")
                # Return the decoded token anyway if configured to be lenient
                if current_app.config.get("KEYCLOAK_LENIENT_VALIDATION", False):
                    logger.warning("Using unverified token due to KEYCLOAK_LENIENT_VALIDATION=True")
                    return decoded
                return None
            except requests.RequestException as e:
                logger.error(f"Failed to fetch JWKS from Keycloak: {str(e)}")
                # Fallback to unverified if JWKS fetch fails
                if current_app.config.get("KEYCLOAK_LENIENT_VALIDATION", False):
                    decoded = jwt.decode(
                        access_token,
                        options={"verify_signature": False},
                    )
                    logger.warning("Using unverified token due to JWKS fetch failure and KEYCLOAK_LENIENT_VALIDATION=True")
                    return decoded
                return None

        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            raise  # Re-raise to be caught by calling method
        except jwt.DecodeError as e:
            logger.error(f"Token decode error: {str(e)}")
            return None
        except Exception as e:
            logger.exception(f"Unexpected error validating token: {str(e)}")
            return None

    def _get_or_create_user(self, user_info: dict[str, Any]) -> Any:
        """
        Get existing user or create new one based on Keycloak user info.
        """
        # Extract user details from token
        email = user_info.get("email")
        username = user_info.get("preferred_username") or email
        first_name = user_info.get("given_name", "")
        last_name = user_info.get("family_name", "")

        if not username:
            logger.error("No username or email in token")
            return None

        # Try to find existing user
        user = security_manager.find_user(username=username)
        
        if user:
            # Update user information if needed
            if email and user.email != email:
                user.email = email
            if first_name and user.first_name != first_name:
                user.first_name = first_name
            if last_name and user.last_name != last_name:
                user.last_name = last_name
            db.session.commit()
            return user

        # Create new user if doesn't exist
        if current_app.config.get("KEYCLOAK_AUTO_CREATE_USER", True):
            # Get default role
            default_role_name = current_app.config.get(
                "AUTH_USER_REGISTRATION_ROLE", "Gamma"
            )
            role = security_manager.find_role(default_role_name)
            
            if not role:
                logger.error("Default role '%s' not found", default_role_name)
                return None

            # Get group roles from token if available
            realm_access = user_info.get("realm_access", {})
            token_roles = realm_access.get("roles", [])
            
            # Map Keycloak roles to Superset roles
            user_roles = self._map_keycloak_roles_to_superset(token_roles)
            if not user_roles:
                user_roles = [role]

            # Create user
            user = security_manager.add_user(
                username=username,
                first_name=first_name,
                last_name=last_name,
                email=email,
                role=user_roles,
            )
            
            logger.info("Created new user: %s", username)
            return user

        logger.warning("User %s not found and auto-creation disabled", username)
        return None

    def _map_keycloak_roles_to_superset(self, keycloak_roles: list[str]) -> list[Any]:
        """
        Map Keycloak roles to Superset roles based on configuration.
        """
        role_mapping = current_app.config.get("KEYCLOAK_ROLE_MAPPING", {})
        superset_roles = []
        
        for keycloak_role in keycloak_roles:
            superset_role_names = role_mapping.get(keycloak_role, [])
            if isinstance(superset_role_names, str):
                superset_role_names = [superset_role_names]
            
            for role_name in superset_role_names:
                role = security_manager.find_role(role_name)
                if role and role not in superset_roles:
                    superset_roles.append(role)
        
        return superset_roles

    def _create_session_for_user(self, user: Any) -> dict[str, str]:
        """
        Create a Flask session for the user and return session cookies.
        Similar to MachineAuthProvider.get_auth_cookies but returns dict.
        """
        with current_app.test_request_context("/api/v1/keycloak_auth/token_login"):
            # Log the user in
            login_user(user)
            
            # Create response to capture cookies
            response = Response()
            
            # Process response to trigger after_request hooks
            current_app.process_response(response)
            
            # Save session
            current_app.session_interface.save_session(
                current_app, session, response
            )

        # Extract cookies from response
        cookies = {}
        for name, value in response.headers:
            if name.lower() == "set-cookie":
                cookie = parse_cookie(value)
                cookie_tuple = list(cookie.items())[0]
                cookies[cookie_tuple[0]] = cookie_tuple[1]

        return cookies

    @expose("/validate_session", methods=["POST"])
    @safe
    def validate_session(self) -> Response:
        """
        Validate if a session cookie is still valid.
        ---
        post:
          summary: Validate session
          description: Check if the provided session cookie is valid
          requestBody:
            required: true
            content:
              application/json:
                schema:
                  type: object
                  required:
                    - session_cookie
                  properties:
                    session_cookie:
                      type: string
          responses:
            200:
              description: Session is valid
            401:
              description: Session is invalid or expired
        """
        try:
            from flask import g
            
            if hasattr(g, "user") and g.user and not g.user.is_anonymous:
                return self.response(
                    200,
                    valid=True,
                    user={
                        "id": g.user.id,
                        "username": g.user.username,
                        "email": g.user.email,
                    },
                )
            return self.response_401(message="Invalid or expired session")
        except Exception as e:
            logger.exception("Error validating session")
            return self.response(500, message=str(e))

    @expose("/debug_token", methods=["POST"])
    @safe
    def debug_token(self) -> Response:
        """
        Debug endpoint to decode token without validation.
        ---
        post:
          summary: Debug token
          description: Decode token and show its contents (no validation)
          requestBody:
            required: true
            content:
              application/json:
                schema:
                  type: object
                  required:
                    - access_token
                  properties:
                    access_token:
                      type: string
          responses:
            200:
              description: Token decoded
            400:
              description: Bad request
        """
        try:
            data = request.json or {}
            access_token = data.get("access_token")

            if not access_token:
                return self.response_400(message="access_token is required")

            # Decode without verification to see what's in the token
            try:
                decoded = jwt.decode(
                    access_token,
                    options={"verify_signature": False},
                )
                return self.response(
                    200,
                    decoded=True,
                    claims=list(decoded.keys()),
                    username=decoded.get("preferred_username"),
                    email=decoded.get("email"),
                    exp=decoded.get("exp"),
                    iat=decoded.get("iat"),
                    realm_access=decoded.get("realm_access"),
                )
            except jwt.DecodeError as e:
                return self.response(
                    400,
                    decoded=False,
                    error=f"Failed to decode token: {str(e)}",
                )
            except Exception as e:
                return self.response(
                    500,
                    decoded=False,
                    error=f"Unexpected error: {str(e)}",
                )

        except Exception as e:
            logger.exception("Error in debug_token")
            return self.response(500, message=str(e))
