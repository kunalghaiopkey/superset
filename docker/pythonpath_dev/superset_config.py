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
#
# This file is included in the final Docker image and SHOULD be overridden when
# deploying the image to prod. Settings configured here are intended for use in local
# development environments. Also note that superset_config_docker.py is imported
# as a final step as a means to override "defaults" configured here
#
import logging
import os
import sys

from celery.schedules import crontab
from flask_caching.backends.filesystemcache import FileSystemCache

logger = logging.getLogger()

DATABASE_DIALECT = os.getenv("DATABASE_DIALECT")
DATABASE_USER = os.getenv("DATABASE_USER")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")
DATABASE_HOST = os.getenv("DATABASE_HOST")
DATABASE_PORT = os.getenv("DATABASE_PORT")
DATABASE_DB = os.getenv("DATABASE_DB")

EXAMPLES_USER = os.getenv("EXAMPLES_USER")
EXAMPLES_PASSWORD = os.getenv("EXAMPLES_PASSWORD")
EXAMPLES_HOST = os.getenv("EXAMPLES_HOST")
EXAMPLES_PORT = os.getenv("EXAMPLES_PORT")
EXAMPLES_DB = os.getenv("EXAMPLES_DB")

# The SQLAlchemy connection string.
SQLALCHEMY_DATABASE_URI = (
    f"{DATABASE_DIALECT}://"
    f"{DATABASE_USER}:{DATABASE_PASSWORD}@"
    f"{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_DB}"
)

SQLALCHEMY_EXAMPLES_URI = (
    f"{DATABASE_DIALECT}://"
    f"{EXAMPLES_USER}:{EXAMPLES_PASSWORD}@"
    f"{EXAMPLES_HOST}:{EXAMPLES_PORT}/{EXAMPLES_DB}"
)

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
REDIS_CELERY_DB = os.getenv("REDIS_CELERY_DB", "0")
REDIS_RESULTS_DB = os.getenv("REDIS_RESULTS_DB", "1")

RESULTS_BACKEND = FileSystemCache("/app/superset_home/sqllab")

CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": 300,
    "CACHE_KEY_PREFIX": "superset_",
    "CACHE_REDIS_HOST": REDIS_HOST,
    "CACHE_REDIS_PORT": REDIS_PORT,
    "CACHE_REDIS_DB": REDIS_RESULTS_DB,
}
DATA_CACHE_CONFIG = CACHE_CONFIG
THUMBNAIL_CACHE_CONFIG = CACHE_CONFIG


class CeleryConfig:
    broker_url = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_CELERY_DB}"
    imports = (
        "superset.sql_lab",
        "superset.tasks.scheduler",
        "superset.tasks.thumbnails",
        "superset.tasks.cache",
    )
    result_backend = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_RESULTS_DB}"
    worker_prefetch_multiplier = 1
    task_acks_late = False
    beat_schedule = {
        "reports.scheduler": {
            "task": "reports.scheduler",
            "schedule": crontab(minute="*", hour="*"),
        },
        "reports.prune_log": {
            "task": "reports.prune_log",
            "schedule": crontab(minute=10, hour=0),
        },
    }


CELERY_CONFIG = CeleryConfig

FEATURE_FLAGS = {"ALERT_REPORTS": True}
ALERT_REPORTS_NOTIFICATION_DRY_RUN = True
WEBDRIVER_BASEURL = f"http://superset_app{os.environ.get('SUPERSET_APP_ROOT', '/')}/"  # When using docker compose baseurl should be http://superset_nginx{ENV{BASEPATH}}/  # noqa: E501
# The base URL for the email report hyperlinks.
WEBDRIVER_BASEURL_USER_FRIENDLY = (
    f"http://localhost:8888/{os.environ.get('SUPERSET_APP_ROOT', '/')}/"
)
SQLLAB_CTAS_NO_LIMIT = True

log_level_text = os.getenv("SUPERSET_LOG_LEVEL", "INFO")
LOG_LEVEL = getattr(logging, log_level_text.upper(), logging.INFO)

if os.getenv("CYPRESS_CONFIG") == "true":
    # When running the service as a cypress backend, we need to import the config
    # located @ tests/integration_tests/superset_test_config.py
    base_dir = os.path.dirname(__file__)
    module_folder = os.path.abspath(
        os.path.join(base_dir, "../../tests/integration_tests/")
    )
    sys.path.insert(0, module_folder)
    from superset_test_config import *  # noqa

    sys.path.pop(0)



try:
    import superset_config_docker
    from superset_config_docker import *  # noqa

    logger.info(
        f"Loaded your Docker configuration at [{superset_config_docker.__file__}]"
    )
except ImportError:
    logger.info("Using default Docker config...")
    
    
    
    
# SECRET_KEY = 'FF74184563DCA713F5673A3EB35D9'
# AUTH_USER_REGISTRATION = True
AUTH_USER_REGISTRATION_ROLE = "Public"
PUBLIC_ROLE_LIKE_GAMMA = True
ENABLE_PROXY_FIX = True
# SESSION_COOKIE_SECURE = True
# SESSION_COOKIE_SAMESITE = "Lax"

# Allow both OAuth and DB login
AUTH_ROLES_SYNC_AT_LOGIN = True



# SQLALCHEMY_DATABASE_URI = 'sqlite:///superset.db'  # Or your production DB
# SQLALCHEMY_TRACK_MODIFICATIONS = False
# SQLALCHEMY_POOL_RECYCLE = 3600
# SQLALCHEMY_ENGINE_OPTIONS = {
    # "pool_pre_ping": True,
# }
    
    


FEATURE_FLAGS = {
    "DASHBOARD_NATIVE_FILTERS_SET": True,
    "EMBEDDABLE_CHARTS": True,
    "VERSIONED_EXPORT": True,
    "DASHBOARD_NATIVE_FILTERS": True,
    "DASHBOARD_CROSS_FILTERS": True,
    "ENABLE_TEMPLATE_PROCESSING": True,
    "EMBEDDED_SUPERSET": True,
    "DRILL_TO_DETAIL": True,
    "ALERT_REPORTS": True,
    "SCHEDULED_QUERIES": True,
    "ENABLE_EXPLORE_DRAG_AND_DROP": True,
    "ENABLE_DATASET_RENAMING":True,
    "ENABLE_REACT_CRUD_VIEWS":True,
    "TAGGING_SYSTEM":True,
    "ENABLE_GLOBAL_ASYNC_QUERIES":True,
    "ENABLE_CUSTOM_COLOR_SCHEMES": True,
    "ENABLE_FILTER_BOX": True,
    "OMNIBAR": True,
      "ALLOW_MULTIPLE_AUTH_PROVIDERS": True,

}

FAB_ADD_SECURITY_API = True
SHOW_STACKTRACE = False



ENABLE_RECAPTCHA = False
RECAPTCHA_PUBLIC_KEY = ""
RECAPTCHA_PRIVATE_KEY = ""


# EMAIL_NOTIFICATIONS = True
# SMTP_HOST = "localhost"
# SMTP_PORT = 25
# SMTP_USER = "user"
# SMTP_PASSWORD = "password"
# SMTP_MAIL_FROM = "superset@example.com"


# ENABLE_TIME_ROTATE = True
# LOG_FORMAT = "%(asctime)s:%(levelname)s:%(name)s:%(message)s"
# LOG_LEVEL = "DEBUG"


DEFAULT_LANGUAGE = "en"
APP_NAME = "Opkey BI-Studio"
APP_ICON = "/static/assets/images/opkey/opkey.png"
FAVICONS = [{"href": "/static/assets/images/opkey/favicon/favicon.ico"}]
WELCOME_MESSAGE = "Welcome to Opkey BI-Studio"

# Setting it to '/' would take the user to '/superset/welcome/'
LOGO_TARGET_PATH = '/bistudio'

# Specify tooltip that should appear when hovering over the App Icon/Logo
LOGO_TOOLTIP = "Opkey BI-Studio"

# Specify any text that should appear to the right of the logo
LOGO_RIGHT_TEXT = "Opkey BI-Studio"


# DEFAULT_FEATURE_FLAGS = {}

DEFAULT_FEATURE_FLAGS: dict[str, bool] = {
    # When using a recent version of Druid that supports JOINs turn this on
    "DRUID_JOINS": False,
    "DYNAMIC_PLUGINS": False,
    "ENABLE_TEMPLATE_PROCESSING": False,
    # Allow for javascript controls components
    # this enables programmers to customize certain charts (like the
    # geospatial ones) by inputting javascript in controls. This exposes
    # an XSS security vulnerability
    "ENABLE_JAVASCRIPT_CONTROLS": False,  # deprecated
    # When this feature is enabled, nested types in Presto will be
    # expanded into extra columns and/or arrays. This is experimental,
    # and doesn't work with all nested types.
    "PRESTO_EXPAND_DATA": False,
    # Exposes API endpoint to compute thumbnails
    "THUMBNAILS": False,
    # Enables the endpoints to cache and retrieve dashboard screenshots via webdriver.
    # Requires configuring Celery and a cache using THUMBNAIL_CACHE_CONFIG.
    "ENABLE_DASHBOARD_SCREENSHOT_ENDPOINTS": False,
    # Generate screenshots (PDF or JPG) of dashboards using the web driver.
    # When disabled, screenshots are generated on the fly by the browser.
    # This feature flag is used by the download feature in the dashboard view.
    # It is dependent on ENABLE_DASHBOARD_SCREENSHOT_ENDPOINT being enabled.
    "ENABLE_DASHBOARD_DOWNLOAD_WEBDRIVER_SCREENSHOT": False,
    "TAGGING_SYSTEM": False,
    "SQLLAB_BACKEND_PERSISTENCE": True,
    "LISTVIEWS_DEFAULT_CARD_VIEW": False,
    # When True, this escapes HTML (rather than rendering it) in Markdown components
    "ESCAPE_MARKDOWN_HTML": False,
    "DASHBOARD_VIRTUALIZATION": True,
    # This feature flag is stil in beta and is not recommended for production use.
    "GLOBAL_ASYNC_QUERIES": False,
    "EMBEDDED_SUPERSET": False,
    # Enables Alerts and reports new implementation
    "ALERT_REPORTS": False,
    "ALERT_REPORT_TABS": False,
    "ALERT_REPORT_SLACK_V2": False,
    "DASHBOARD_RBAC": False,
    "ENABLE_ADVANCED_DATA_TYPES": False,
    # Enabling ALERTS_ATTACH_REPORTS, the system sends email and slack message
    # with screenshot and link
    # Disables ALERTS_ATTACH_REPORTS, the system DOES NOT generate screenshot
    # for report with type 'alert' and sends email and slack message with only link;
    # for report with type 'report' still send with email and slack message with
    # screenshot and link
    "ALERTS_ATTACH_REPORTS": True,
    # Allow users to export full CSV of table viz type.
    # This could cause the server to run out of memory or compute.
    "ALLOW_FULL_CSV_EXPORT": False,
    "ALLOW_ADHOC_SUBQUERY": False,
    "USE_ANALOGOUS_COLORS": False,
    # Apply RLS rules to SQL Lab queries. This requires parsing and manipulating the
    # query, and might break queries and/or allow users to bypass RLS. Use with care!
    "RLS_IN_SQLLAB": False,
    # Try to optimize SQL queries — for now only predicate pushdown is supported.
    "OPTIMIZE_SQL": False,
    # When impersonating a user, use the email prefix instead of the username
    "IMPERSONATE_WITH_EMAIL_PREFIX": False,
    # Enable caching per impersonation key (e.g username) in a datasource where user
    # impersonation is enabled
    "CACHE_IMPERSONATION": False,
    # Enable caching per user key for Superset cache (not database cache impersonation)
    "CACHE_QUERY_BY_USER": False,
    # Enable sharing charts with embedding
    "EMBEDDABLE_CHARTS": True,
    "DRILL_TO_DETAIL": True,  # deprecated
    "DRILL_BY": True,
    "DATAPANEL_CLOSED_BY_DEFAULT": False,
    # The feature is off by default, and currently only supported in Presto and Postgres,  # noqa: E501
    # and Bigquery.
    # It also needs to be enabled on a per-database basis, by adding the key/value pair
    # `cost_estimate_enabled: true` to the database `extra` attribute.
    "ESTIMATE_QUERY_COST": False,
    # Allow users to enable ssh tunneling when creating a DB.
    # Users must check whether the DB engine supports SSH Tunnels
    # otherwise enabling this flag won't have any effect on the DB.
    "SSH_TUNNELING": False,
    "AVOID_COLORS_COLLISION": True,
    # Do not show user info in the menu
    "MENU_HIDE_USER_INFO": False,
    # Allows users to add a ``superset://`` DB that can query across databases. This is
    # an experimental feature with potential security and performance risks, so use with
    # caution. If the feature is enabled you can also set a limit for how much data is
    # returned from each database in the ``SUPERSET_META_DB_LIMIT`` configuration value
    # in this file.
    "ENABLE_SUPERSET_META_DB": False,
    # Set to True to replace Selenium with Playwright to execute reports and thumbnails.
    # Unlike Selenium, Playwright reports support deck.gl visualizations
    # Enabling this feature flag requires installing "playwright" pip package
    "PLAYWRIGHT_REPORTS_AND_THUMBNAILS": False,
    # Set to True to enable experimental chart plugins
    "CHART_PLUGINS_EXPERIMENTAL": False,
    # Regardless of database configuration settings, force SQLLAB to run async
    # using Celery
    "SQLLAB_FORCE_RUN_ASYNC": False,
    # Set to True to to enable factory resent CLI command
    "ENABLE_FACTORY_RESET_COMMAND": False,
    # Whether Superset should use Slack avatars for users.
    # If on, you'll want to add "https://avatars.slack-edge.com" to the list of allowed
    # domains in your TALISMAN_CONFIG
    "SLACK_ENABLE_AVATARS": False,
    # Adds a switch to the navbar to easily switch between light and dark themes.
    # This is intended to use for development, visual review, and theming-debugging
    # purposes.
    "THEME_ENABLE_DARK_THEME_SWITCH": False,
    # Adds a theme editor as a modal dialog in the navbar. Allows people to type in JSON
    # and see the changes applied to the current theme.
    # This is intended to use for theme creation, visual review and theming-debugging
    # purposes.
    "THEME_ALLOW_THEME_EDITOR_BETA": False,
    # Allow users to optionally specify date formats in email subjects, which will
    # be parsed if enabled
    "DATE_FORMAT_IN_EMAIL_SUBJECT": False,
    # Allow metrics and columns to be grouped into (potentially nested) folders in the
    # chart builder
    "DATASET_FOLDERS": False,
    "THEME_ALLOW_THEME_EDITOR_BETA": False,
}
THEME = { }

ENVIRONMENT_TAG_CONFIG = {
    "variable": "SUPERSET_ENV",
    "values": {
        "debug":{},
        "development": {},
        "production": {},
    },
}


ROW_LIMIT = 50000
SQL_MAX_ROW = 1000000
MAX_TABLE_NAMES = 3000
# CSV_EXPORT = {"encoding": "utf-8"}
# LOG_RETENTION = 30


# UPLOAD_FOLDER = '/app/uploads/'
# IMG_UPLOAD_FOLDER = '/app/uploads/images/'
# CSV_EXPORT = {"encoding": "utf-8"}


# CACHE_CONFIG = {
    # 'CACHE_TYPE': 'redis',
    # 'CACHE_DEFAULT_TIMEOUT': 300,
    # 'CACHE_KEY_PREFIX': 'superset_',
    # 'CACHE_REDIS_URL': 'redis://localhost:6379/0'
# }

# DATA_CACHE_CONFIG = CACHE_CONFIG
# FILTER_STATE_CACHE_CONFIG = CACHE_CONFIG
# EXPLORE_FORM_DATA_CACHE_CONFIG = CACHE_CONFIG

SAMPLES_ROLE_CONFIG = None



