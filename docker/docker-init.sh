#!/usr/bin/env bash
#
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
set -e

#
# Always install local overrides first
#
/app/docker/docker-bootstrap.sh

if [ "$SUPERSET_LOAD_EXAMPLES" = "yes" ]; then
    STEP_CNT=4
else
    STEP_CNT=3
fi

echo_step() {
cat <<EOF
######################################################################
Init Step ${1}/${STEP_CNT} [${2}] -- ${3}
######################################################################
EOF
}
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"
# If Cypress run – overwrite the password for admin and export env variables
if [ "$CYPRESS_CONFIG" == "true" ]; then
    ADMIN_PASSWORD="general"
    export SUPERSET_TESTENV=true
    export POSTGRES_DB=superset_cypress
    export SUPERSET__SQLALCHEMY_DATABASE_URI=postgresql+psycopg2://superset:superset@db:5432/superset_cypress
fi
# Initialize the database
echo_step "1" "Starting" "Applying DB migrations"
# The metadata DB can be stamped with an alembic revision that this codebase
# does not ship (e.g. another Superset build pointed at the same schema ran its
# own migration). `db upgrade` then dies with "Can't locate revision ...".
# Instead of dropping the schema, re-stamp it to this codebase's head and retry.
# Disable with SUPERSET_RESTAMP_UNKNOWN_REVISION=false.
UPGRADE_LOG=$(mktemp)
set +e
superset db upgrade 2>&1 | tee "$UPGRADE_LOG"
UPGRADE_RC=${PIPESTATUS[0]}
set -e
if [ "$UPGRADE_RC" -ne 0 ]; then
    if grep -q "Can't locate revision identified by" "$UPGRADE_LOG" \
        && [ "${SUPERSET_RESTAMP_UNKNOWN_REVISION:-true}" = "true" ]; then
        echo "WARNING: metadata DB is stamped with a revision unknown to this code."
        echo "WARNING: re-stamping alembic_version to this code's head and retrying."
        python - <<'PYEOF'
from alembic.script import ScriptDirectory
from flask import current_app
from sqlalchemy import text

from superset.app import create_app

app = create_app()
with app.app_context():
    from superset.extensions import db

    cfg = current_app.extensions["migrate"].migrate.get_config()
    head = ScriptDirectory.from_config(cfg).get_current_head()
    old = [r[0] for r in db.session.execute(text("SELECT version_num FROM alembic_version"))]
    db.session.execute(text("DELETE FROM alembic_version"))
    db.session.execute(text("INSERT INTO alembic_version (version_num) VALUES (:v)"), {"v": head})
    db.session.commit()
    print(f"Re-stamped alembic_version {old} -> {head}")
PYEOF
        superset db upgrade
    else
        rm -f "$UPGRADE_LOG"
        exit "$UPGRADE_RC"
    fi
fi
rm -f "$UPGRADE_LOG"
echo_step "1" "Complete" "Applying DB migrations"

# Create an admin user
echo_step "2" "Starting" "Setting up admin user ( admin / $ADMIN_PASSWORD )"
if [ "$CYPRESS_CONFIG" == "true" ]; then
    superset load_test_users
else
    superset fab create-admin \
        --username admin \
        --email admin@superset.com \
        --password "$ADMIN_PASSWORD" \
        --firstname Superset \
        --lastname Admin
fi
echo_step "2" "Complete" "Setting up admin user"
# Create default roles and permissions
echo_step "3" "Starting" "Setting up roles and perms"
superset init
echo_step "3" "Complete" "Setting up roles and perms"

if [ "$SUPERSET_LOAD_EXAMPLES" = "yes" ]; then
    # Load some data to play with
    echo_step "4" "Starting" "Loading examples"
    # If Cypress run which consumes superset_test_config – load required data for tests
    if [ "$CYPRESS_CONFIG" == "true" ]; then
        superset load_examples --load-test-data
    else
        superset load_examples
    fi
    echo_step "4" "Complete" "Loading examples"
fi
