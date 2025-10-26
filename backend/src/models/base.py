from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Iterable, Self, Type

from pydantic import BaseModel
from sqlalchemy.orm import DeclarativeBase


class SerializerMixin:
    """Reusable helpers for SQLAlchemy models.

    - to_dict: safe dict for JSON responses (Decimal→float, datetime/date→isoformat)
    - to_schema: build a Pydantic model from an ORM instance
    - from_schema: construct ORM instance from a Pydantic model (filters unknown fields)
    """

    def _iter_column_items(self) -> Iterable[tuple[str, Any]]:
        # Works for mapped classes that have __table__
        for col in self.__table__.columns:  # type: ignore[attr-defined]
            yield col.name, getattr(self, col.name)

    @staticmethod
    def _serialize_value(value: Any) -> Any:
        if isinstance(value, Decimal):
            # Convert to float for client-friendly JSON
            return float(value)
        if isinstance(value, (datetime, date)):
            return value.isoformat()
        return value

    def to_dict(
        self,
        *,
        include: set[str] | None = None,
        exclude: set[str] | None = None,
    ) -> dict[str, Any]:
        include = include or set()
        exclude = exclude or set()

        result: dict[str, Any] = {}
        for key, value in self._iter_column_items():
            if include and key not in include:
                continue
            if key in exclude:
                continue
            result[key] = self._serialize_value(value)
        return result

    def to_schema(self, schema_type: Type[BaseModel]) -> BaseModel:
        """Validate this ORM instance into a Pydantic model.

        Requires the target schema to set `model_config = ConfigDict(from_attributes=True)`
        or `class Config: from_attributes = True`.
        """
        return schema_type.model_validate(self)

    @classmethod
    def from_schema(cls, schema: BaseModel) -> Self:
        """Create an ORM instance from a Pydantic model, filtering extras."""
        data = schema.model_dump()
        allowed = {c.name for c in cls.__table__.columns}  # type: ignore[attr-defined]
        filtered = {k: v for k, v in data.items() if k in allowed}
        return cls(**filtered)  # type: ignore[arg-type]

# SQLAlchemy ORM Base with reusable serialization helpers
class Base(SerializerMixin, DeclarativeBase):
    pass