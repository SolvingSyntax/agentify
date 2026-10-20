# Import all the models so that Base has them registered before being loaded by Alembic or SQLAlchemy
from app.db.base_class import Base  # noqa
from app.models.user import User, Workspace  # noqa
from app.models.agent import Agent  # noqa
from app.models.workflow import Workflow, Execution, ExecutionStep  # noqa
from app.models.approval import Approval  # noqa
from app.models.integration import Integration  # noqa