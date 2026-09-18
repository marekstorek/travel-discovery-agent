import db
from agent import extract_spots
from models.requests import VideoRequest, UserCreateRequest
from models.auth import UserInDB
from source_downloader import download_video

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pwdlib import PasswordHash
from pydantic import ValidationError
from yt_dlp.utils import ExtractorError,DownloadError
import psycopg, os, logging

logging.basicConfig(level=logging.INFO, filename="app.log")

app = FastAPI(title="Travel Discovery Agent API")

password_hash = PasswordHash.recommended()
# DUMMY_HASH = password_hash.hash("dummypassword")

def get_password_hash(password: str) -> str:
    return password_hash.hash(password)

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
):
    default_user_id = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
    return StreamingResponse(
        content = save_video_generator(str(input.url), user_id=default_user_id),
        media_type="text/event-stream"
    )
