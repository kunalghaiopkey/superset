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
            user_info = data.get("user_profile")
            
            if not user_info:
                return self.response_401()

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
