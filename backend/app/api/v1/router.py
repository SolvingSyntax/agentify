from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    dashboard,
    auth,
    agents,
    workflows,
    approvals,
    integrations,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(agents.router, prefix="/agents", tags=["Agents"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["Workflows"])
api_router.include_router(approvals.router, prefix="/approvals", tags=["Approvals"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["Integrations"])