import db
from agent import extract_spots
from models.requests import VideoRequest, UserCreateRequest, UserSpotsRequest
from models.auth import User, UserInDB, Token, TokenData
from source_downloader import download_video
from constants import SECRET_KEY, DUMMY_HASH, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pwdlib import PasswordHash
from pydantic import ValidationError
from yt_dlp.utils import ExtractorError,DownloadError
import psycopg, os, logging, jwt
from jwt.exceptions import InvalidTokenError
from datetime import datetime, timedelta, timezone
from typing import Annotated
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, filename="app.log")

app = FastAPI(title="Travel Discovery Agent API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://travel-discovery-agent.vercel.app/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_password_hash(password: str) -> str:
    return password_hash.hash(password)

def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception
    user = db.select_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def authenticate_user(username: str, password: str):
    user = db.select_user(username)
    if not user:
        verify_password(password, DUMMY_HASH)
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

@app.post("/token")
def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")

@app.post("/sign-up")
def sign_up(
    new_user_request: UserCreateRequest,
):
    existing_user = db.select_user(new_user_request.username)
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="User with this username already exists")
    hashed_password = get_password_hash(new_user_request.password)
    db_user = UserInDB(username=new_user_request.username, hashed_password=hashed_password, disabled=False)
    db.insert_user(db_user)
    return {"message": "User created successfully!"}

@app.get("/")
def root():
    return {"message": "Travel Discovery Agent API runs!"}

def save_video_generator(url: str, user_id: str):
    yield "data: Received your request:\n\n"
    try:
        video_path = download_video(url)
        yield "data: Processing video.\n\n"
        response = extract_spots(video_path)
        if len(response.spots) == 0:
            yield "data: No spots found!\n\n"
            return
        else:
            for spot in response.spots:
                spot.source_link = url
                logging.info(f"Saving {spot.category}: {spot.name}")
            yield f"data: {len(response.spots)} spots found! Saving...\n\n"
        db.insert_spots(response.spots, user_id=user_id)
        yield f"data: Done! {len(response.spots)} spots saved successfully!\n\n"
    except DownloadError as e:
        logging.error(e)
        yield "data: Video couldn't be downloaded.\n\n"
    except ExtractorError as e:
        logging.error(e)
        yield "data: Video couldn't be processed.\n\n"
    except ValidationError as e:
        yield "data: Something went wrong :(\n\n"
    except psycopg.errors.DatabaseError as e:
        logging.error(e)
        yield "data: Database error encountered:\n\n"
    except Exception as e:
        logging.error(e)
        yield "data: Something went wrong :(\n\n"
    finally:
        try:
            os.remove(video_path)
        except Exception as _:
            pass

@app.post("/save-video")
def save_video(
    input: VideoRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    # default_user_id = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
    return StreamingResponse(
        content = save_video_generator(str(input.url), user_id=current_user.id),
        media_type="text/event-stream"
    )

@app.get("/spots")
def get_user_spots(
    current_user: Annotated[User, Depends(get_current_active_user)],
    filters: Annotated[UserSpotsRequest, Depends()],
):
    query = db.select_user_spots(current_user.id, filters.limit)
    return query

