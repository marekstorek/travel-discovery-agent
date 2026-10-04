# Travel Discovery Agent

An end-to-end application that extracts travel destinations, viewpoints, and businesses from short-form videos and saves them as structured, geolocated spots.

The project consists of a FastAPI backend, a Google Gemini-powered extraction pipeline, a PostgreSQL database, and a web frontend with an OpenStreetMap-based map.

## Overview

The project covers:

* extracting travel recommendations from Instagram Reels, TikTok, and YouTube Shorts
* assigning spots to categories and extracting relevant details
* resolving GPS coordinates
* streaming processing progress to the frontend using Server-Sent Events (SSE)
* storing and browsing saved spots by user

## Processing Pipeline
Video URL → yt-dlp → Gemini → Pydantic validation → PostgreSQL → Next.js map

## AI Extraction

* downloads videos using `yt-dlp`
* processes videos using the asynchronous Google Gemini API
* enforces structured JSON output using Pydantic schemas and category-specific models
* retries extraction when validation fails or no spots are returned

Example extracted spot:

```json
{
  "name": "Via Ferrata Felice Spellini",
  "category": "Hike",
  "country": "Italy",
  "region": "Trentino-Alto Adige", 
  "latitude": 46.158, 
  "longitude": 10.902,
  "commentary": "An intense and vertical via ferrata used as an access route to the Bocchette Centrali from Rifugio Pedrotti. It is characterized by steep vertical ladders, some of which are slightly overhanging, making it physically demanding.",
  "source_link": "https://www.instagram.com/p/DcbB4IhAB02/",
  "difficulty": "Hard",
  "checkpoints": [],
  "chairlift_available": false,
  "needs_climbing_gear": false, 
  "needs_via_ferrata_set": true
}
```

## Backend & Streaming

* asynchronous FastAPI backend
* `asyncio.to_thread` for video downloads to avoid blocking the event loop
* Server-Sent Events using `StreamingResponse` to report download, extraction, and database progress in real time
* OAuth2 password flow with JWT authentication
* endpoints:

  * `POST /sign-up` — register a user
  * `POST /token` — authenticate and obtain a JWT
  * `POST /save-video` — process a video and save extracted spots
  * `GET /spots` — retrieve, filter, and paginate saved spots

You can visit, create an account, and try it yourself:
- https://travel-discovery-agent.vercel.app

Or you can test the API directly using the interactive Swagger documentation:
- https://travel-discovery-agent-513892807779.europe-west1.run.app/docs 

## Database

* PostgreSQL with the asynchronous `psycopg` driver
* category-specific spot attributes validated through Pydantic models
* user-specific storage and retrieval

## Technologies

* **Backend:** Python 3.13, FastAPI, Uvicorn, asyncio, Pydantic
* **AI:** Google Gemini API, `google-genai`
* **Video Processing:** `yt-dlp`
* **Database:** PostgreSQL, `psycopg`
* **Authentication:** OAuth2, JWT, PyJWT, `pwdlib`
* **Frontend:** Next.js, TypeScript, Tailwind CSS, OpenStreetMap
* **Deployment:** GitHub Actions (CI/CD), Docker, Google Cloud Run, Vercel
