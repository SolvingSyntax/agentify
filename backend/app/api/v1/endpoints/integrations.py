from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.db.session import get_db
from app.models.integration import Integration
from app.models.user import Workspace
from app.schemas.integration import (
    IntegrationCreate,
    IntegrationUpdate,
    IntegrationResponse,
    TestEmailRequest,
)
from app.services.email_service import email_service

router = APIRouter()


@router.get("/", response_model=List[IntegrationResponse])
def list_integrations(
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """List all integrations configured for the active workspace."""
    return (
        db.query(Integration)
        .filter(Integration.workspace_id == current_workspace.id)
        .all()
    )


@router.post("/", response_model=IntegrationResponse, status_code=status.HTTP_201_CREATED)
def create_integration(
    integration_in: IntegrationCreate,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """Add a new integration (e.g. SMTP settings) to the workspace."""
    integration = Integration(
        workspace_id=current_workspace.id,
        provider=integration_in.provider,
        name=integration_in.name,
        is_connected=integration_in.is_connected,
        config=integration_in.config,
    )
    db.add(integration)
    db.commit()
    db.refresh(integration)
    return integration


@router.get("/{integration_id}", response_model=IntegrationResponse)
def get_integration(
    integration_id: str,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """Get details of a specific workspace integration."""
    integration = (
        db.query(Integration)
        .filter(
            Integration.id == integration_id,
            Integration.workspace_id == current_workspace.id,
        )
        .first()
    )
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found"
        )
    return integration


@router.put("/{integration_id}", response_model=IntegrationResponse)
def update_integration(
    integration_id: str,
    integration_in: IntegrationUpdate,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """Update workspace integration configuration."""
    integration = (
        db.query(Integration)
        .filter(
            Integration.id == integration_id,
            Integration.workspace_id == current_workspace.id,
        )
        .first()
    )
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found"
        )

    update_data = integration_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(integration, field, value)

    db.add(integration)
    db.commit()
    db.refresh(integration)
    return integration


@router.delete("/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_integration(
    integration_id: str,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
):
    """Delete an integration."""
    integration = (
        db.query(Integration)
        .filter(
            Integration.id == integration_id,
            Integration.workspace_id == current_workspace.id,
        )
        .first()
    )
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found"
        )

    db.delete(integration)
    db.commit()
    return None


@router.post("/{integration_id}/test-email")
def send_test_email(
    integration_id: str,
    email_in: TestEmailRequest,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace),
) -> Any:
    """Send a test email using the configured SMTP integration."""
    integration = (
        db.query(Integration)
        .filter(
            Integration.id == integration_id,
            Integration.workspace_id == current_workspace.id,
        )
        .first()
    )
    if not integration or integration.provider != "smtp":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid SMTP integration not found for this workspace",
        )

    try:
        email_service.send_email(
            recipient=email_in.recipient_email,
            subject=email_in.subject,
            body=email_in.body,
            smtp_config=integration.config,
        )
        return {"status": "success", "message": f"Test email sent to {email_in.recipient_email}"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to dispatch email: {str(e)}",
        )