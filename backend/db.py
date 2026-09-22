from models.spots import Spot, BaseSpot
from models.auth import UserInDB
from constants import DATABASE_URL

from uuid import UUID
import psycopg
from psycopg.rows import dict_row
import psycopg.errors
from pydantic import TypeAdapter
import json

type_adapter = TypeAdapter(Spot)

def get_connection():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)

def init_db():
    with open("create_script.sql", "r", encoding="utf-8") as f:
        create_script = f.read()
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(create_script)
        conn.commit()

def insert_spots(spots: list[Spot], user_id: UUID):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            for spot in spots:
                common_fields = ["user_id", "name", "category", "commentary", "source_link",
                                 "country", "region", "latitude", "longitude", "details"]
                dump = spot.model_dump(mode="json")
                details = {k: v for k, v in dump.items() if k not in common_fields and v is not None}

                cursor.execute(
                    """
                        INSERT INTO spots (user_id, name, category, commentary, 
                        source_link, country, region, latitude, longitude, details)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (user_id, spot.name, spot.category, spot.commentary, spot.source_link,
                     spot.country, spot.region, spot.latitude, spot.longitude, json.dumps(details))
                )
            conn.commit()

def select_user_spots(
    user_id: UUID,
    limit: int = 50,
) -> list[Spot]:
    with get_connection() as conn:
        with conn.cursor() as cursor:
            query = """
                SELECT * FROM spots 
                WHERE user_id = %s
                ORDER BY created_at DESC 
                LIMIT %s
            """
            values = (user_id, limit)
            cursor.execute(query, values)
            rows = cursor.fetchall()
            spots = []
            for row in rows:
                details = row.pop("details") or {}
                spots.append({**row, **details})

            return [type_adapter.validate_python(spot) for spot in spots]


def insert_user(user: UserInDB):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                    INSERT INTO users (username, hashed_password, disabled)
                    VALUES (%s, %s, %s)
                """,
                (user.username, user.hashed_password, user.disabled)
           )
            conn.commit()


def select_user(username: str) -> UserInDB | None :
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, username, disabled, hashed_password FROM users WHERE username = %s
            """, (username,)
            )
            row = cursor.fetchone()
            if row is not None:
                return UserInDB.model_validate(row)
            return None
