from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.db.session import get_db
from app.models.workflow import Workflow, Execution
from app.models.user import Workspace
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowResponse,
    ExecutionResponse,
    ExecutionTriggerRequest,
)
from app.services.workflow_engine import workflow_engine, WorkflowValidationError

router = APIRouter()


@router.get("/", response_model=List[WorkflowResponse])
def list_workflows(
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """List all workflows within the active workspace."""
    workflows = (
        db.query(Workflow).filter(Workflow.workspace_id == current_workspace.id).all()
    )
    return workflows


@router.post(
    "/", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED
)
def create_workflow(
    workflow_in: WorkflowCreate,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """Create a new workflow after validating its DAG structure."""
    nodes_dict = [node.model_dump() for node in workflow_in.nodes]
    edges_dict = [edge.model_dump() for edge in workflow_in.edges]

    try:
        workflow_engine.validate_dag(nodes_dict, edges_dict)
    except WorkflowValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    workflow = Workflow(
        workspace_id=current_workspace.id,
        name=workflow_in.name,
        description=workflow_in.description,
        nodes=nodes_dict,
        edges=edges_dict,
        is_active=workflow_in.is_active,
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """Get workflow details by ID."""
    workflow = (
        db.query(Workflow)
        .filter(
            Workflow.id == workflow_id,
            Workflow.workspace_id == current_workspace.id,
        )
        .first()
    )
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found"
        )
    return workflow


@router.put("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(
    workflow_id: str,
    workflow_in: WorkflowUpdate,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """Update an existing workflow and re-validate DAG structure."""
    workflow = (
        db.query(Workflow)
        .filter(
            Workflow.id == workflow_id,
            Workflow.workspace_id == current_workspace.id,
        )
        .first()
    )
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found"
        )

    update_data = workflow_in.model_dump(exclude_unset=True)

    updated_nodes = update_data.get("nodes", workflow.nodes)
    updated_edges = update_data.get("edges", workflow.edges)
    try:
        workflow_engine.validate_dag(updated_nodes, updated_edges)
    except WorkflowValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    for field, value in update_data.items():
        setattr(workflow, field, value)

    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
):
    """Delete a workflow."""
    workflow = (
        db.query(Workflow)
        .filter(
            Workflow.id == workflow_id,
            Workflow.workspace_id == current_workspace.id,
        )
        .first()
    )
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found"
        )

    db.delete(workflow)
    db.commit()
    return None


@router.post("/{workflow_id}/execute", response_model=ExecutionResponse)
def execute_workflow(
    workflow_id: str,
    trigger_in: ExecutionTriggerRequest,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """Trigger an execution for a workflow."""
    workflow = (
        db.query(Workflow)
        .filter(
            Workflow.id == workflow_id,
            Workflow.workspace_id == current_workspace.id,
        )
        .first()
    )
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found"
        )

    if not workflow.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Workflow is inactive"
        )

    execution = workflow_engine.execute_workflow(
        db, workflow, trigger_in.initial_input
    )
    return execution


@router.get("/{workflow_id}/executions", response_model=List[ExecutionResponse])
def list_workflow_executions(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """List execution history for a workflow."""
    workflow = (
        db.query(Workflow)
        .filter(
            Workflow.id == workflow_id,
            Workflow.workspace_id == current_workspace.id,
        )
        .first()
    )
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found"
        )

    executions = (
        db.query(Execution).filter(Execution.workflow_id == workflow.id).all()
    )
    return executions