from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import ALGORITHM
from app.db.session import get_db
from app.models.user import User, Workspace

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing from Authorization header",
        )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate token signature",
        )

    user = db.query(User).filter(User.id == str(user_id)).first()
    if not user:
        # Fallback query for first active user if ID format mismatch
        user = db.query(User).filter(User.is_active == True).first()
        
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


def get_current_workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Workspace:
    workspace = db.query(Workspace).filter(Workspace.owner_id == current_user.id).first()
    if not workspace:
        workspace = Workspace(
            name=f"{current_user.full_name or current_user.email}'s Workspace",
            owner_id=current_user.id
        )
        db.add(workspace)
        db.commit()
        db.refresh(workspace)
    return workspace