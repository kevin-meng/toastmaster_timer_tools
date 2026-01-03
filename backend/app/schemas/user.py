from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    phone: Optional[str] = None
    wechat_openid: Optional[str] = None
    username: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    pass

class UserUpdate(UserBase):
    pass

class UserInDBBase(UserBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass
