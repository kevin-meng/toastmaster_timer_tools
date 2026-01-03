from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.models.user import User
from app.schemas.token import Token
from app.services.sms import SMSService

router = APIRouter()


@router.post("/send-sms-code")
def send_sms_code(phone: str = Body(..., embed=True)) -> Any:
    """
    Send SMS verification code.
    """
    SMSService.send_verification_code(phone)
    return {"msg": "Verification code sent"}


@router.post("/login/phone", response_model=Token)
def login_phone(
    phone: str = Body(...),
    code: str = Body(...),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Login or register with phone and verification code.
    """
    if not SMSService.verify_code(phone, code):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        # Auto register
        user = User(phone=phone)
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = security.create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/login/wechat", response_model=Token)
def login_wechat(
    code: str = Body(..., embed=True),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Login with WeChat code.
    TODO: Implement real WeChat login logic.
    1. Call WeChat API with code to get openid/session_key
    2. Find or create user by openid
    """
    # MOCK implementation
    mock_openid = f"mock_openid_{code}"

    user = db.query(User).filter(User.wechat_openid == mock_openid).first()
    if not user:
        user = User(wechat_openid=mock_openid)
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = security.create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
