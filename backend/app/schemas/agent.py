from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field


class AgentBase(BaseModel):
    name: str = Field(..., example="Customer Support Bot")
    description: Optional[str] = Field(None, example="Handles basic customer support inquiries")
    role: str = Field("assistant", example="assistant")
    model: str = Field("gemini-1.5-flash", example="gemini-1.5-flash")
    system_prompt: str = Field(..., example="You are a helpful customer service assistant.")
    tools: Optional[List[str]] = Field(default_factory=list)
    is_active: bool = True


class AgentCreate(AgentBase):
    pass


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    role: Optional[str] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    tools: Optional[List[str]] = None
    is_active: Optional[bool] = None


class AgentResponse(AgentBase):
    id: str
    workspace_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentTestRequest(BaseModel):
    prompt: str = Field(..., example="Hello! Who are you?")


class AgentTestResponse(BaseModel):
    agent_id: str
    prompt: str
    response: str