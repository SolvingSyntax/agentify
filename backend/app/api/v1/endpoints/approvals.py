from typing import List, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.db.session import get_db
from app.models.approval import Approval
from app.models.workflow import Execution, ExecutionStep
from app.models.user import User, Workspace
from app.schemas.approval import ApprovalResponse, ApprovalActionRequest

router = APIRouter()


@router.get("/", response_model=List[ApprovalResponse])
def list_approvals(
    status_filter: str = "pending",
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """List pending or processed human-in-the-loop approvals for the workspace."""
    query = db.query(Approval).filter(Approval.workspace_id == current_workspace.id)
    if status_filter:
        query = query.filter(Approval.status == status_filter)
    return query.all()


@router.get("/{approval_id}", response_model=ApprovalResponse)
def get_approval(
    approval_id: str,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """Get details of a specific approval gate."""
    approval = (
        db.query(Approval)
        .filter(
            Approval.id == approval_id,
            Approval.workspace_id == current_workspace.id,
        )
        .first()
    )
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Approval request not found"
        )
    return approval


@router.post("/{approval_id}/action", response_model=ApprovalResponse)
def process_approval_action(
    approval_id: str,
    action_in: ApprovalActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """Approve or reject a pending workflow execution gate."""
    if action_in.status not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be either 'approved' or 'rejected'",
        )

    approval = (
        db.query(Approval)
        .filter(
            Approval.id == approval_id,
            Approval.workspace_id == current_workspace.id,
        )
        .first()
    )
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Approval request not found"
        )

    if approval.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Approval has already been processed as '{approval.status}'",
        )

    # Update approval state
    approval.status = action_in.status
    approval.approver_id = current_user.id
    approval.comment = action_in.comment

    # Update corresponding Execution and ExecutionStep status
    execution = (
        db.query(Execution).filter(Execution.id == approval.execution_id).first()
    )
    if execution:
        if action_in.status == "approved":
            execution.status = "completed"
            execution.completed_at = datetime.now(timezone.utc)
        else:
            execution.status = "failed"
            execution.error_message = (
                f"Execution rejected by user: {action_in.comment or 'No comment provided'}"
            )
            execution.completed_at = datetime.now(timezone.utc)

    if approval.step_id:
        step = (
            db.query(ExecutionStep)
            .filter(ExecutionStep.id == approval.step_id)
            .first()
        )
        if step:
            step.status = "completed" if action_in.status == "approved" else "failed"
            step.output_data = {
                "decision": action_in.status,
                "approver": current_user.email,
                "comment": action_in.comment,
            }
            step.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(approval)
    return approval