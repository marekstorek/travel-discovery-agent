from uuid import UUID
from pydantic import BaseModel, Field

class User(BaseModel):
    id: UUID | None = Field(default=None, description="The user ID")
    username: str
    disabled: bool | None = None

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None
