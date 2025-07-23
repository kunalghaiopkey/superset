import json
from datetime import datetime
from flask import g, redirect
from flask_appbuilder import expose
from superset import conf
from superset.extensions import appbuilder
from superset.views.base import BaseSupersetView, common_bootstrap_payload
from superset.views.utils import bootstrap_user_data
from superset.superset_typing import FlaskResponse
from superset.utils.core import get_user_id

# Fallback datetime serializer for JSON
def fallback_json_serializer(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


class HomeView(BaseSupersetView):
    route_base = "/home"

    @expose("/")
    def home(self) -> FlaskResponse:
        """Custom home route that allows public users if configured."""

        if not g.user or not get_user_id():
            if conf.get("PUBLIC_ROLE_LIKE"):
                return self.render_template("superset/public_welcome.html")
            return redirect(appbuilder.get_url_for_login)

        # Authenticated user → load Superset SPA
        payload = {
            "user": bootstrap_user_data(g.user, include_perms=True),
            "common": common_bootstrap_payload(),
        }

        return self.render_template(
            "superset/spa.html",
            entry="spa",
            bootstrap_data=json.dumps(payload, default=fallback_json_serializer),
        )
