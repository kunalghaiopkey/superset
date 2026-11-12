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
SQL saved in a dataset runs with the access of whoever can explore the dataset, so
saving it requires access to the tables it reads.
"""

from collections.abc import Iterator
from typing import Any

import pytest
from flask import g
from pytest_mock import MockerFixture
from sqlalchemy.orm.session import Session

from superset.exceptions import SupersetSecurityException
from superset.sql_parse import Table


@pytest.fixture
def dataset(session: Session) -> Iterator[Any]:
    """
    A virtual dataset with a calculated column and a metric, saved without a user.
    """
    from superset.connectors.sqla.models import SqlaTable, SqlMetric, TableColumn
    from superset.models.core import Database

    SqlaTable.metadata.create_all(session.get_bind())  # pylint: disable=no-member
    database = Database(database_name="db", sqlalchemy_uri="sqlite://")
    dataset = SqlaTable(
        table_name="v",
        schema="vulcan",
        sql="SELECT a FROM t",
        database=database,
        columns=[
            TableColumn(column_name="a"),
            TableColumn(column_name="c", expression="a + 1"),
        ],
        metrics=[SqlMetric(metric_name="m", expression="SUM(a)")],
    )
    session.add(dataset)
    session.flush()
    yield dataset
    session.rollback()


@pytest.fixture
def raise_for_access(mocker: MockerFixture, dataset: Any) -> Iterator[Any]:
    """
    The access check, called for writes by a user from now on.
    """
    g.user = mocker.MagicMock(id=None)
    yield mocker.patch(
        "superset.connectors.sqla.models.security_manager.raise_for_access"
    )
    del g.user


def checked_sql(raise_for_access: Any) -> list[str]:
    return [call.kwargs["sql"] for call in raise_for_access.call_args_list]


def test_flush_without_user_is_not_checked(
    mocker: MockerFixture,
    session: Session,
    dataset: Any,
) -> None:
    raise_for_access = mocker.patch(
        "superset.connectors.sqla.models.security_manager.raise_for_access"
    )
    dataset.sql = "SELECT * FROM other.t"
    session.flush()

    raise_for_access.assert_not_called()


def test_flush_unchanged_sql_is_not_checked(
    session: Session,
    dataset: Any,
    raise_for_access: Any,
) -> None:
    dataset.description = "new"
    session.flush()

    raise_for_access.assert_not_called()


def test_flush_checks_changed_sql(
    session: Session,
    dataset: Any,
    raise_for_access: Any,
) -> None:
    dataset.sql = "SELECT * FROM other.t"
    session.flush()

    raise_for_access.assert_called_once_with(
        database=dataset.database,
        sql="SELECT * FROM other.t",
        catalog=None,
        schema="vulcan",
        template_params={},
    )


def test_flush_checks_all_sql_when_template_params_change(
    session: Session,
    dataset: Any,
    raise_for_access: Any,
) -> None:
    """
    Template parameters change what the SQL reads, so all of it is checked again.
    """
    dataset.template_params = '{"t": ", other.t"}'
    session.flush()

    assert checked_sql(raise_for_access) == [
        "SELECT a FROM t",
        "SELECT a + 1",
        "SELECT SUM(a)",
    ]
    assert raise_for_access.call_args.kwargs["template_params"] == {"t": ", other.t"}


def test_flush_checks_schema_change(
    session: Session,
    dataset: Any,
    raise_for_access: Any,
) -> None:
    dataset.schema = "other"
    session.flush()

    assert checked_sql(raise_for_access) == [
        "SELECT a FROM t",
        "SELECT a + 1",
        "SELECT SUM(a)",
    ]
    assert {call.kwargs["schema"] for call in raise_for_access.call_args_list} == {
        "other"
    }


@pytest.mark.parametrize("model", ["TableColumn", "SqlMetric"])
def test_flush_checks_new_expression(
    session: Session,
    dataset: Any,
    raise_for_access: Any,
    model: str,
) -> None:
    from superset.connectors.sqla import models

    item = getattr(models, model)(table=dataset, expression="(SELECT x FROM other.t)")
    if model == "TableColumn":
        item.column_name = "leak"
    else:
        item.metric_name = "leak"
    session.add(item)
    session.flush()

    assert checked_sql(raise_for_access) == ["SELECT (SELECT x FROM other.t)"]


def test_flush_checks_fetch_values_predicate(
    session: Session,
    dataset: Any,
    raise_for_access: Any,
) -> None:
    dataset.fetch_values_predicate = "a IN (SELECT x FROM other.t)"
    session.flush()

    assert checked_sql(raise_for_access) == [
        "SELECT a FROM t",
        "SELECT 1 WHERE a IN (SELECT x FROM other.t)",
    ]


def test_flush_checks_new_physical_dataset(
    session: Session,
    dataset: Any,
    raise_for_access: Any,
) -> None:
    from superset.connectors.sqla.models import SqlaTable

    session.add(SqlaTable(table_name="t", schema="other", database=dataset.database))
    session.flush()

    raise_for_access.assert_called_once_with(
        database=dataset.database,
        table=Table("t", "other", None),
    )


def test_flush_refused(
    mocker: MockerFixture,
    session: Session,
    dataset: Any,
    raise_for_access: Any,
) -> None:
    error = mocker.MagicMock()
    raise_for_access.side_effect = SupersetSecurityException(error)
    dataset.sql = "SELECT * FROM other.t"

    with pytest.raises(SupersetSecurityException) as excinfo:
        session.flush()
    assert excinfo.value.error is error


@pytest.fixture
def dao_raise_for_access(mocker: MockerFixture) -> Any:
    return mocker.patch("superset.daos.dataset.security_manager.raise_for_access")


def make_dataset(mocker: MockerFixture) -> Any:
    return mocker.MagicMock(
        catalog=None,
        schema="vulcan",
        template_params_dict={},
        columns=[
            mocker.MagicMock(id=1, expression=None),
            mocker.MagicMock(id=2, expression="a + 1"),
        ],
        metrics=[mocker.MagicMock(id=3, expression="SUM(a)")],
    )


@pytest.mark.parametrize(
    "attributes, checked",
    [
        ({"description": "new"}, []),
        # Unchanged, or not given: kept as they are
        ({"columns": [{"id": 1}, {"id": 2}]}, []),
        ({"columns": [{"id": 2, "expression": "a + 1"}]}, []),
        ({"metrics": [{"id": 3, "verbose_name": "M"}]}, []),
        # New or changed
        (
            {"columns": [{"id": 2}, {"column_name": "x", "expression": "(SELECT 1)"}]},
            ["SELECT (SELECT 1)"],
        ),
        ({"columns": [{"id": 2, "expression": "a + 2"}]}, ["SELECT a + 2"]),
        (
            {"metrics": [{"metric_name": "n", "expression": "MAX(a)"}]},
            ["SELECT MAX(a)"],
        ),
        # A different schema or template parameters: all of them
        ({"schema": "other"}, ["SELECT a + 1", "SELECT SUM(a)"]),
        (
            {"template_params": '{"t": 1}', "columns": [{"id": 2}]},
            ["SELECT a + 1", "SELECT SUM(a)"],
        ),
    ],
)
def test_dao_update_checks_column_and_metric_sql(
    mocker: MockerFixture,
    dao_raise_for_access: Any,
    attributes: dict[str, Any],
    checked: list[str],
) -> None:
    """
    Columns and metrics are written in bulk, out of sight of the flush check, so
    the update checks them first.
    """
    from superset.daos.dataset import DatasetDAO

    DatasetDAO.raise_for_expression_access(make_dataset(mocker), attributes)

    assert checked_sql(dao_raise_for_access) == checked


def test_dao_update_checks_with_new_schema_and_template_params(
    mocker: MockerFixture,
    dao_raise_for_access: Any,
) -> None:
    from superset.daos.dataset import DatasetDAO

    dataset = make_dataset(mocker)
    DatasetDAO.raise_for_expression_access(
        dataset,
        {"schema": "other", "template_params": '{"t": 1}', "metrics": []},
    )

    dao_raise_for_access.assert_called_once_with(
        database=dataset.database,
        sql="SELECT a + 1",
        catalog=None,
        schema="other",
        template_params={"t": 1},
    )


def test_dao_update_refused_writes_nothing(
    mocker: MockerFixture,
    dao_raise_for_access: Any,
) -> None:
    from superset.daos.dataset import DatasetDAO

    dao_raise_for_access.side_effect = SupersetSecurityException(mocker.MagicMock())
    update_columns = mocker.patch.object(DatasetDAO, "update_columns")
    dataset = make_dataset(mocker)

    with pytest.raises(SupersetSecurityException):
        DatasetDAO.update(
            dataset,
            {"columns": [{"column_name": "x", "expression": "(SELECT 1)"}]},
        )
    update_columns.assert_not_called()
