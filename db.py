from models import Spot
from constants import DATABASE_URL

from uuid import UUID
import psycopg
from psycopg.rows import dict_row
import psycopg.errors

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
                cursor.execute(
                    """
                        INSERT INTO spots (user_id, name, category, commentary, source_link, country, region, latitude, longitude)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """,
                    (user_id, spot.name, spot.category, spot.commentary, spot.source_link, spot.country, spot.region, spot.latitude, spot.longitude)
                )
                row = cursor.fetchone()
                spot_id = row["id"]
                query, values = get_query_and_values(spot, spot_id)
                if query is not None and values is not None:
                    cursor.execute(query, values)
            conn.commit()

def get_query_and_values(spot, spot_id):
    match spot.category:
        case "Hike":
            query = """
                 INSERT INTO hike_details (spot_id, total_elevation_meters, min_altitude_meters, max_altitude_meters, length_km, duration_minutes, duration_days, difficulty, needs_via_ferrata_set, needs_climbing_gear, chairlift_available, checkpoints)
                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
             """
            values = (spot_id, spot.total_elevation_meters, spot.min_altitude_meters, spot.max_altitude_meters,
                      spot.length_km, spot.duration_minutes, spot.duration_days, spot.difficulty,
                      spot.needs_via_ferrata_set, spot.needs_climbing_gear, spot.chairlift_available, spot.checkpoints)
        case "Summit":
            query = """
                 INSERT INTO summit_details (spot_id, altitude_meters, min_elevation_to_access_meters, difficulty, needs_via_ferrata_set, needs_climbing_gear, chairlift_available)
                 VALUES (%s, %s, %s, %s, %s, %s, %s)
             """
            values = (spot_id, spot.altitude_meters, spot.min_elevation_to_access_meters, spot.difficulty,
                      spot.needs_via_ferrata_set, spot.needs_climbing_gear, spot.chairlift_available)
        case "Viewpoint":
            query = """
                 INSERT INTO viewpoint_details (spot_id, altitude_meters, difficulty)
                 VALUES (%s, %s, %s)
             """
            values = (spot_id, spot.altitude_meters, spot.difficulty)
        case "Beach":
            query = """
                 INSERT INTO beach_details (spot_id, surface, length_meters)
                 VALUES (%s, %s, %s)
             """
            values = (spot_id, spot.surface, spot.length_meters)
        case "Food":
            query = """
                 INSERT INTO food_details (spot_id, food_type, speciality)
                 VALUES (%s, %s, %s)
             """
            values = (spot_id, spot.food_type, spot.speciality)
        case "Culture":
            query = """
                 INSERT INTO culture_details (spot_id, culture_type)
                 VALUES (%s, %s)
             """
            values = (spot_id, spot.culture_type)
        case "Camp":
            query = """
                 INSERT INTO camp_details (spot_id, is_for_cars, has_shower, swimming_available)
                 VALUES (%s, %s, %s, %s)
             """
            values = (spot_id, spot.is_for_cars, spot.has_shower, spot.swimming_available)
        case _:
            query = None
            values = None
    return query, values
