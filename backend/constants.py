import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")
DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$Xig9wFkAIRhvN+K3E2Zlbw$yVCATTwI9PuF06w4R8CApfjySjYL664fsO2I3lxDTmE" # dummypassword
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
