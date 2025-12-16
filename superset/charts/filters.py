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
from flask_login import current_user
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


class ChartAllTextFilter(BaseFilter):
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


# -------------------------
# FAVORITES
# -------------------------
class ChartFavoriteFilter(BaseFavoriteFilter):
    arg_name = "chart_is_favorite"
    class_name = "slice"
    model = Slice


# -------------------------
# TAG FILTERS
# -------------------------
class ChartTagNameFilter(BaseTagNameFilter):
    arg_name = "chart_tags"
    class_name = "slice"
    model = Slice


class ChartTagIdFilter(BaseTagIdFilter):
    arg_name = "chart_tag_id"
    class_name = "slice"
    model = Slice


# -------------------------
# CERTIFICATION
# -------------------------
class ChartCertifiedFilter(BaseFilter):
    name = _("Is certified")
    arg_name = "chart_is_certified"

    def apply(self, query: Query, value: Any) -> Query:
        if value is True:
            return query.filter(Slice.certified_by.isnot(None))
        if value is False:
            return query.filter(Slice.certified_by.is_(None))
        return query


# -------------------------
# DATASET / CHART ACCESS
# -------------------------
class ChartFilter(BaseFilter):
    model = models.Slice

    def apply(self, query: Query, value: Any) -> Query:
        # Admin can see everything
        if security_manager.can_access_all_datasources():
            return query

        # Guest users: rely only on dataset access rules
        if security_manager.is_guest_user():
            return query.filter(get_dataset_access_filters(self.model))

        user_id = get_user_id()

        # Dataset permissions via roles
        perms = security_manager.user_view_menu_names("datasource_access")
        allowed_dataset_ids = [
            int(p.split("(id:")[1].split(")")[0])
            for p in perms
            if "(id:" in p
        ]

        # Datasets owned by user
        owned_dataset_ids = (
            db.session.query(models.SqlaTable.id)
            .join(models.SqlaTable.owners)
            .filter(security_manager.user_model.id == user_id)
        )

        # Charts owned by user
        owned_chart_ids = (
            db.session.query(models.Slice.id)
            .join(models.Slice.owners)
            .filter(security_manager.user_model.id == user_id)
        )

        return query.filter(
            or_(
                self.model.datasource_id.in_(allowed_dataset_ids),
                self.model.datasource_id.in_(owned_dataset_ids),
                self.model.id.in_(owned_chart_ids),
            )
        )


# -------------------------
# CREATED BY EXISTS
# -------------------------
class ChartHasCreatedByFilter(BaseFilter):
    name = _("Has created by")
    arg_name = "chart_has_created_by"

    def apply(self, query: Query, value: Any) -> Query:
        if value is True:
            return query.filter(Slice.created_by_fk.isnot(None))
        if value is False:
            return query.filter(Slice.created_by_fk.is_(None))
        return query


# -------------------------
# CREATED / CHANGED BY ME
# -------------------------
class ChartCreatedByMeFilter(BaseFilter):
    name = _("Created by me")
    arg_name = "chart_created_by_me"

    def apply(self, query: Query, value: Any) -> Query:
        if security_manager.is_guest_user():
            return query

        user_id = get_user_id()
        return query.filter(
            or_(
                Slice.created_by_fk == user_id,
                Slice.changed_by_fk == user_id,
            )
        )


# -------------------------
# OWNED / CREATED / FAVORED
# -------------------------
class ChartOwnedCreatedFavoredByMeFilter(BaseFilter):
    name = _("Owned Created or Favored")
    arg_name = "chart_owned_created_favored_by_me"

    def apply(self, query: Query, value: Any) -> Query:
        # Skip for anonymous or guest users
        if (
            security_manager.current_user is None
            or security_manager.is_guest_user()
        ):
            return query

        user_id = get_user_id()

        owner_ids_query = (
            db.session.query(Slice.id)
            .join(Slice.owners)
            .filter(security_manager.user_model.id == user_id)
        )

        return (
            query.join(
                FavStar,
                and_(
                    FavStar.user_id == user_id,
                    FavStar.class_name == "slice",
                    Slice.id == FavStar.obj_id,
                ),
                isouter=True,
            )
            .filter(
                or_(
                    Slice.id.in_(owner_ids_query),
                    Slice.created_by_fk == user_id,
                    Slice.changed_by_fk == user_id,
                    FavStar.user_id == user_id,
                )
            )
        )
