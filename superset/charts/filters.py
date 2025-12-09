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
from typing import Any

from flask_babel import lazy_gettext as _
from sqlalchemy import and_, or_
from sqlalchemy.orm import aliased
from sqlalchemy.orm.query import Query

from superset import db, security_manager
from superset.connectors.sqla import models
from superset.connectors.sqla.models import SqlaTable
from superset.models.core import FavStar
from superset.models.slice import Slice
from superset.tags.filters import BaseTagIdFilter, BaseTagNameFilter
from superset.utils.core import get_user_id
from superset.utils.filters import get_dataset_access_filters
from superset.views.base import BaseFilter
from superset.views.base_api import BaseFavoriteFilter
from flask_login import current_user
from sqlalchemy import or_


class ChartAllTextFilter(BaseFilter):  # pylint: disable=too-few-public-methods
    name = _("All Text")
    arg_name = "chart_all_text"

    def apply(self, query: Query, value: Any) -> Query:
        if not value:
            return query
        ilike_value = f"%{value}%"
        return query.filter(
            or_(
                Slice.slice_name.ilike(ilike_value),
                Slice.description.ilike(ilike_value),
                Slice.viz_type.ilike(ilike_value),
                SqlaTable.table_name.ilike(ilike_value),
            )
        )


class ChartFavoriteFilter(BaseFavoriteFilter):  # pylint: disable=too-few-public-methods
    """
    Custom filter for the GET list that filters all charts that a user has favored
    """

    arg_name = "chart_is_favorite"
    class_name = "slice"
    model = Slice


class ChartTagNameFilter(BaseTagNameFilter):  # pylint: disable=too-few-public-methods
    """
    Custom filter for the GET list that filters all charts associated with
    a certain tag (by its name).
    """

    arg_name = "chart_tags"
    class_name = "slice"
    model = Slice


class ChartTagIdFilter(BaseTagIdFilter):  # pylint: disable=too-few-public-methods
    """
    Custom filter for the GET list that filters all charts associated with
    a certain tag (by its ID).
    """

    arg_name = "chart_tag_id"
    class_name = "slice"
    model = Slice


class ChartCertifiedFilter(BaseFilter):  # pylint: disable=too-few-public-methods
    """
    Custom filter for the GET list that filters all certified charts
    """

    name = _("Is certified")
    arg_name = "chart_is_certified"

    def apply(self, query: Query, value: Any) -> Query:
        if value is True:
            return query.filter(and_(Slice.certified_by.isnot(None)))
        if value is False:
            return query.filter(and_(Slice.certified_by.is_(None)))
        return query



class ChartFilter(BaseFilter):
    model = models.Slice  # Charts

    def apply(self, query: Query, value: Any) -> Query:
        # Admin: return everything
        if security_manager.can_access_all_datasources():
            return query

        #  Role-based dataset permissions
        perms = security_manager.user_view_menu_names("datasource_access")
        allowed_dataset_ids = []
        for p in perms:
            if "(id:" in p:
                ds_id = int(p.split("(id:")[1].split(")")[0])
                allowed_dataset_ids.append(ds_id)

        #  Datasets owned by the current user
        owned_dataset_ids = (
            db.session.query(models.SqlaTable.id)
            .join(models.SqlaTable.owners)
            .filter(security_manager.user_model.id == current_user.id)
        )

        #  Charts owned by the current user
        owned_chart_ids = (
            db.session.query(models.Slice.id)
            .join(models.Slice.owners)
            .filter(security_manager.user_model.id == current_user.id)
        )

        #  Combine dataset & chart access rules
        filters = or_(
            # User has access to dataset through role
            self.model.datasource_id.in_(allowed_dataset_ids),

            # User owns the dataset
            self.model.datasource_id.in_(owned_dataset_ids),

            # User owns the chart
            self.model.id.in_(owned_chart_ids),
        )

        return query.filter(filters)


class ChartHasCreatedByFilter(BaseFilter):  # pylint: disable=too-few-public-methods
    """
    Custom filter for the GET list that filters all charts created by user
    """

    name = _("Has created by")
    arg_name = "chart_has_created_by"

    def apply(self, query: Query, value: Any) -> Query:
        if value is True:
            return query.filter(and_(Slice.created_by_fk.isnot(None)))
        if value is False:
            return query.filter(and_(Slice.created_by_fk.is_(None)))
        return query


class ChartCreatedByMeFilter(BaseFilter):  # pylint: disable=too-few-public-methods
    name = _("Created by me")
    arg_name = "chart_created_by_me"

    def apply(self, query: Query, value: Any) -> Query:
        return query.filter(
            or_(
                Slice.created_by_fk  # pylint: disable=comparison-with-callable
                == get_user_id(),
                Slice.changed_by_fk  # pylint: disable=comparison-with-callable
                == get_user_id(),
            )
        )


class ChartOwnedCreatedFavoredByMeFilter(BaseFilter):  # pylint: disable=too-few-public-methods
    """
    Custom filter for the GET chart that filters all charts the user
    owns, created, changed or favored.
    """

    name = _("Owned Created or Favored")
    arg_name = "chart_owned_created_favored_by_me"

    def apply(self, query: Query, value: Any) -> Query:
        # If anonymous user filter nothing
        if security_manager.current_user is None:
            return query

        owner_ids_query = (
            db.session.query(Slice.id)
            .join(Slice.owners)
            .filter(security_manager.user_model.id == get_user_id())
        )

        return query.join(
            FavStar,
            and_(
                FavStar.user_id == get_user_id(),
                FavStar.class_name == "slice",
                Slice.id == FavStar.obj_id,
            ),
            isouter=True,
        ).filter(
            # pylint: disable=comparison-with-callable
            or_(
                Slice.id.in_(owner_ids_query),
                Slice.created_by_fk == get_user_id(),
                Slice.changed_by_fk == get_user_id(),
                FavStar.user_id == get_user_id(),
            )
        )
