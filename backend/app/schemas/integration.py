from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr


class IntegrationBase(BaseModel):
    provider: str = Field(..., example="smtp")  # e.g., 'smtp', 'gemini'
    name: str = Field(..., example="Workspace Primary Email")
    is_connected: bool = True
    config: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        example={"host": "smtp.gmail.com", "port": 587, "username": "user@example.com"}
    )


class IntegrationCreate(IntegrationBase):
    pass


class IntegrationUpdate(BaseModel):
    provider: Optional[str] = None
    name: Optional[str] = None
    is_connected: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None


class IntegrationResponse(IntegrationBase):
    id: str
    workspace_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TestEmailRequest(BaseModel):
    recipient_email: EmailStr
    subject: str = Field("Test Email from Agentify", example="Test Email from Agentify")
    body: str = Field("This is a test notification from Agentify SMTP integration.", example="Hello World")