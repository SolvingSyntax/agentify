from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ApprovalActionRequest(BaseModel):
    status: str = Field(..., example="approved")  # approved or rejected
    comment: Optional[str] = Field(None, example="Approved after budget review.")


class ApprovalResponse(BaseModel):
    id: str
    workspace_id: str
    execution_id: str
    step_id: Optional[str] = None
    action_name: str
    payload: Optional[Any] = None
    status: str
    approver_id: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True