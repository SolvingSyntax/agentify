from typing import Any
from sqlalchemy.orm import DeclarativeBase, declared_attr


class Base(DeclarativeBase):
    id: Any
    __name__: str

    # Automatically generate default plural table names (e.g. User -> users)
    @declared_attr.directive
    def __tablename__(cls) -> str:
        return cls.__name__.lower() + "s"