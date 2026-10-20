from typing import Dict
from fastapi import APIRouter

router = APIRouter()


@router.get("/health", response_model=Dict[str, str])
def health_check() -> Dict[str, str]:
    return {
        "status": "healthy",
        "service": "Agentify API",
        "version": "1.0.0"
    }