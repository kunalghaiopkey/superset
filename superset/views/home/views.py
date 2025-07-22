from flask_appbuilder import expose, has_access
from superset.views.base import BaseSupersetView
from superset.superset_typing import FlaskResponse

class HomeView(BaseSupersetView):
    route_base = "/home"

    @expose("/")
    @has_access
    def home(self) -> FlaskResponse:
        return super().render_app_template()
