from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.db.session import get_db
from app.models.agent import Agent
from app.models.user import Workspace
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse, AgentTestRequest, AgentTestResponse
from app.services.gemini_service import gemini_service

router = APIRouter()


@router.get("/", response_model=List[AgentResponse])
def list_agents(
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace)
) -> Any:
    """List all AI agents within the active workspace."""
    agents = db.query(Agent).filter(Agent.workspace_id == current_workspace.id).all()
    return agents


@router.post("/", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
def create_agent(
    agent_in: AgentCreate,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace)
) -> Any:
    """Create a new AI agent in the active workspace."""
    agent = Agent(
        workspace_id=current_workspace.id,
        name=agent_in.name,
        description=agent_in.description,
        role=agent_in.role,
        model=agent_in.model,
        system_prompt=agent_in.system_prompt,
        tools=agent_in.tools or [],
        is_active=agent_in.is_active
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace)
) -> Any:
    """Get agent details by ID."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.workspace_id == current_workspace.id
    ).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    return agent


@router.put("/{agent_id}", response_model=AgentResponse)
def update_agent(
    agent_id: str,
    agent_in: AgentUpdate,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace)
) -> Any:
    """Update an existing AI agent."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.workspace_id == current_workspace.id
    ).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    update_data = agent_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agent, field, value)

    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace)
):
    """Delete an AI agent from the active workspace."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.workspace_id == current_workspace.id
    ).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    db.delete(agent)
    db.commit()
    return None


@router.post("/{agent_id}/test", response_model=AgentTestResponse)
def test_agent(
    agent_id: str,
    test_in: AgentTestRequest,
    db: Session = Depends(get_db),
    current_workspace: Workspace = Depends(deps.get_current_workspace)
) -> Any:
    """Execute a test run for an agent using Google Gemini."""
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.workspace_id == current_workspace.id
    ).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    # Live generation using Gemini AI service
    response_text = gemini_service.generate(
        prompt=test_in.prompt,
        system_prompt=agent.system_prompt,
        model=agent.model
    )

    return {
        "agent_id": agent.id,
        "prompt": test_in.prompt,
        "response": response_text
    }