from constants import GEMINI_API_KEY

from google import genai
import time

def extract_spots(file_path: str):
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
        )

        response = chat.send_message(
            message=[
                video_file,
                "Extract all the spots from the source. "
            ],
        )

        print(response.text)

    finally:
        try:
            client.files.delete(name=video_file.name)
        except:
            pass
