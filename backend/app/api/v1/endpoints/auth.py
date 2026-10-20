from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.db.session import get_db
from app.models.user import User, Workspace
from app.schemas.user import UserCreate, UserResponse, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    """Register a new user and auto-create their default workspace."""
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists."
        )

    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Auto-provision primary workspace
    workspace = Workspace(
        name=f"{user.full_name or user.email}'s Workspace",
        owner_id=user.id
    )
    db.add(workspace)
    db.commit()

    return user


@router.post("/login", response_model=Dict[str, Any])
def login(login_in: UserLogin, db: Session = Depends(get_db)) -> Any:
    """Authenticate user and return access token with user metadata."""
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    access_token = create_access_token(subject=user.id)
    workspace = db.query(Workspace).filter(Workspace.owner_id == user.id).first()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        },
        "workspace": {
            "id": workspace.id if workspace else None,
            "name": workspace.name if workspace else "Default Workspace"
        }
    }


@router.get("/me", response_model=Dict[str, Any])
def get_current_user_profile(
    current_user: User = Depends(deps.get_current_user),
    current_workspace: Workspace = Depends(deps.get_current_workspace)
) -> Any:
    """Get active user and workspace details."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "workspace_id": current_workspace.id,
        "workspace_name": current_workspace.name
    }


@router.get("/workspaces")
def list_workspaces(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """List workspaces for the current user."""
    workspaces = db.query(Workspace).filter(Workspace.owner_id == current_user.id).all()
    return [{"id": ws.id, "name": ws.name} for ws in workspaces]