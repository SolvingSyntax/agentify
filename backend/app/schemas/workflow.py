from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class NodeSchema(BaseModel):
    id: str = Field(..., example="node-1")
    name: str = Field(..., example="Input Classifier")
    type: str = Field(..., example="agent")  # agent, prompt, approval, email
    config: Dict[str, Any] = Field(default_factory=dict)


class EdgeSchema(BaseModel):
    id: str = Field(..., example="edge-1")
    source: str = Field(..., example="node-1")
    target: str = Field(..., example="node-2")
    condition: Optional[str] = None


class WorkflowBase(BaseModel):
    name: str = Field(..., example="Customer Support Automation")
    description: Optional[str] = Field(None, example="Classifies and resolves support tickets")
    nodes: List[NodeSchema] = Field(default_factory=list)
    edges: List[EdgeSchema] = Field(default_factory=list)
    is_active: bool = True


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[NodeSchema]] = None
    edges: Optional[List[EdgeSchema]] = None
    is_active: Optional[bool] = None


class WorkflowResponse(WorkflowBase):
    id: str
    workspace_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExecutionStepResponse(BaseModel):
    id: str
    execution_id: str
    node_id: str
    node_name: str
    node_type: str
    status: str
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExecutionResponse(BaseModel):
    id: str
    workflow_id: str
    workspace_id: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    steps: List[ExecutionStepResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ExecutionTriggerRequest(BaseModel):
    initial_input: Dict[str, Any] = Field(default_factory=dict, example={"ticket": "I need help with billing."})