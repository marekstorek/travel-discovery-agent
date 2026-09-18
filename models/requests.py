from pydantic import BaseModel, HttpUrl


class VideoRequest(BaseModel):
    url: HttpUrl
