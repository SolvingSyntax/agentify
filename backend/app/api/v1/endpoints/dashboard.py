from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.db.session import get_db
from app.models.agent import Agent
from app.models.workflow import Workflow, Execution
from app.models.approval import Approval
from app.models.user import Workspace

router = APIRouter()


@router.get("", response_model=Dict[str, Any])
@router.get("/", response_model=Dict[str, Any])
@router.get("/summary", response_model=Dict[str, Any])
@router.get("/stats", response_model=Dict[str, Any])
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace)
) -> Any:
    """Get live stats and summary metrics for the active workspace."""
    total_agents = db.query(Agent).filter(Agent.workspace_id == current_workspace.id).count()
    total_workflows = db.query(Workflow).filter(Workflow.workspace_id == current_workspace.id).count()
    total_executions = db.query(Execution).filter(Execution.workspace_id == current_workspace.id).count()
    pending_approvals = db.query(Approval).filter(
        Approval.workspace_id == current_workspace.id,
        Approval.status == "pending"
    ).count()

    return {
        "total_agents": total_agents,
        "total_workflows": total_workflows,
        "total_executions": total_executions,
        "pending_approvals": pending_approvals,
        "active_agents": total_agents,
        "active_workflows": total_workflows,
        "workspace_id": current_workspace.id,
        "workspace_name": current_workspace.name,
        "status": "online"
    }