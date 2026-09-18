from pydantic import BaseModel, HttpUrl


class VideoRequest(BaseModel):
    url: HttpUrl

class UserCreateRequest(BaseModel):
    username: str
    password: str
