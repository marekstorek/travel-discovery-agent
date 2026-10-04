import yt_dlp
import uuid
import asyncio

async def download_video(url, output_path='downloads'):
    name = uuid.uuid4().hex
    print(type(name))
    ydl_opts = {
        'format': 'bestvideo[height<=720]+bestaudio/best[height<=720]/best',
        'outtmpl': f'{output_path}/{name}.%(ext)s',
        "merge_output_format": "mp4",
        'quiet': False,
    }
    def download():
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

    await asyncio.to_thread(download)

    return f'{output_path}/{name}.mp4'
