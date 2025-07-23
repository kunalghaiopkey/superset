from flask import g, redirect
from flask_appbuilder import expose
from superset import conf
from superset.extensions import appbuilder
from superset.views.base import BaseSupersetView
from superset.superset_typing import FlaskResponse
from superset.utils.core import get_user_id

class LicenseErrorView(BaseSupersetView):
    route_base = "/license/error"

    @expose("/")
    def error(self) -> FlaskResponse:
        """Publicly accessible license error page."""
        if not g.user or not get_user_id():
            return redirect(appbuilder.get_url_for_login)


        return self.render_template("superset/license_error.html")
