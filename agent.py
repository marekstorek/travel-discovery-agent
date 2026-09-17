from constants import GEMINI_API_KEY
from models import AiResponse

from google.genai.types import GenerateContentConfig
from google import genai
from pydantic import ValidationError
import time
import json

system_instructions = f"""
Please extract information from the attached source. It should be one or more spots. Please, try to classify 
these spots into following: Hike, Summit (mountain summit), Viewpoint, City, Beach, Food (some type of bar, restaurant etc),
Culture (some type of theatre, museum, monument etc), Camp. If you fail to classify it, use general OtherSpot.
Please, the commentary should not be too short. Include any tips and anything if it makes sense. 
You may need to complete some information from your knowledge or find it on the internet - such as longitude and latitude. If you don't know, do not hallucinate and assign 
None. Please, return the response as a json - list of spots with this schema: {json.dumps(AiResponse.model_json_schema(), ensure_ascii=False)}
"""

def extract_spots(file_path: str) -> AiResponse:
    client = genai.Client(api_key=GEMINI_API_KEY)
    video_file = client.files.upload(file=file_path)

    try:
        while video_file.state.name == "PROCESSING":
            time.sleep(5)
            video_file = client.files.get(name=video_file.name)

        if video_file.state.name == "FAILED" or video_file.state.name != "ACTIVE":
            raise RuntimeError(f"Video upload failed: {video_file.error}")

        chat = client.chats.create(
            model="gemini-3.5-flash",
            config=GenerateContentConfig(
                response_mime_type="application/json",
                system_instruction=system_instructions,
                temperature=0.5,
                # tools=[types.Tool(google_search=types.GoogleSearch())]
            )
        )

        response = chat.send_message(
            message=[
                video_file,
                "Extract all the spots from the source. "
            ],
        )

        try:
            result: AiResponse = AiResponse.model_validate_json(response.text)
            return result
        except ValidationError as e:
            return AiResponse()

    finally:
        try:
            client.files.delete(name=video_file.name)
        except:
            pass
