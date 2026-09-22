import yt_dlp
import uuid

def download_video(url, output_path='downloads'):
    name = uuid.uuid4().hex
    print(type(name))
    ydl_opts = {
        'format': 'bestvideo[height<=720]+bestaudio/best[height<=720]/best',
        'outtmpl': f'{output_path}/{name}.%(ext)s',
        "merge_output_format": "mp4",
        'quiet': False,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:

        ydl.download([url])

    return f'{output_path}/{name}.mp4'
