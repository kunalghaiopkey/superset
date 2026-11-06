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
Runs before `superset db upgrade` in docker-init.sh.

The metadata schema is shared with another Superset version (5 vs 6). Each
version tracks its migration revision in its own table (ALEMBIC_VERSION_TABLE),
so they never overwrite each other's revision.

1. Own version table missing but schema already populated (first run against
   the shared schema): create it and stamp this code's head, so alembic does
   not try to re-create existing tables.
2. Own version table holds a revision this code doesn't ship: re-stamp to head
   instead of failing with "Can't locate revision ...". Disable with
   SUPERSET_RESTAMP_UNKNOWN_REVISION=false.
"""

import os

from alembic.script import ScriptDirectory
from alembic.util import CommandError
from flask import current_app
from sqlalchemy import inspect, text

from superset.app import create_app

app = create_app()
with app.app_context():
    from superset.extensions import db

    table = current_app.config.get("ALEMBIC_VERSION_TABLE", "alembic_version")
    script = ScriptDirectory.from_config(
        current_app.extensions["migrate"].migrate.get_config()
    )
    head = script.get_current_head()
    insp = inspect(db.engine)

    def stamp(old: list[str]) -> None:
        db.session.execute(text(f"DELETE FROM {table}"))  # noqa: S608
        db.session.execute(
            text(f"INSERT INTO {table} (version_num) VALUES (:v)"),  # noqa: S608
            {"v": head},
        )
        db.session.commit()
        print(f"[alembic-guard] {table}: {old} -> {head}")

    if not insp.has_table(table):
        if insp.has_table("dashboards"):
            db.session.execute(
                text(
                    f"CREATE TABLE {table} (version_num VARCHAR(32) NOT NULL, "
                    f"CONSTRAINT {table}_pkc PRIMARY KEY (version_num))"
                )
            )
            print(f"[alembic-guard] created {table} on existing schema")
            stamp([])
        else:
            print(f"[alembic-guard] fresh database, {table} will be created")
    else:
        current = [
            r[0] for r in db.session.execute(text(f"SELECT version_num FROM {table}"))  # noqa: S608
        ]
        unknown = []
        for rev in current:
            try:
                if script.get_revision(rev) is None:
                    unknown.append(rev)
            except CommandError:
                unknown.append(rev)
        if unknown:
            if os.environ.get("SUPERSET_RESTAMP_UNKNOWN_REVISION", "true") == "true":
                print(f"[alembic-guard] WARNING unknown revision(s) {unknown}")
                stamp(current)
            else:
                print(f"[alembic-guard] unknown revision(s) {unknown}, not touching")
        else:
            print(f"[alembic-guard] {table} at {current}, ok")
