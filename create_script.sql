CREATE TABLE IF NOT EXISTS users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    disabled BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS spots(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    commentary TEXT,
    source_link TEXT,
    country TEXT,
    region TEXT,
    latitude FLOAT,
    longitude FLOAT
);

CREATE TABLE IF NOT EXISTS hike_details(
    spot_id UUID PRIMARY KEY REFERENCES spots(id) ON DELETE CASCADE,
    total_elevation_meters INT,
    min_altitude_meters INT,
    max_altitude_meters INT,
    length_km FLOAT,
    duration_minutes INT,
    duration_days INT,
    difficulty TEXT,
    needs_via_ferrata_set BOOLEAN,
    needs_climbing_gear BOOLEAN,
    chairlift_available BOOLEAN,
    checkpoints TEXT[]
);

CREATE TABLE IF NOT EXISTS summit_details(
    spot_id UUID PRIMARY KEY REFERENCES spots(id) ON DELETE CASCADE,
    altitude_meters INT,
    min_elevation_to_access_meters INT,
    difficulty TEXT,
    needs_via_ferrata_set BOOLEAN,
    needs_climbing_gear BOOLEAN,
    chairlift_available BOOLEAN
);

CREATE TABLE IF NOT EXISTS viewpoint_details(
    spot_id UUID PRIMARY KEY REFERENCES spots(id) ON DELETE CASCADE,
    altitude_meters INT,
    difficulty TEXT
);


CREATE TABLE IF NOT EXISTS beach_details(
    spot_id UUID PRIMARY KEY REFERENCES spots(id) ON DELETE CASCADE,
    surface TEXT,
    length_meters INT
);

CREATE TABLE IF NOT EXISTS food_details(
    spot_id UUID PRIMARY KEY REFERENCES spots(id) ON DELETE CASCADE,
    food_type TEXT,
    speciality TEXT[]
);

CREATE TABLE IF NOT EXISTS culture_details(
    spot_id UUID PRIMARY KEY REFERENCES spots(id) ON DELETE CASCADE,
    culture_type TEXT
);

CREATE TABLE IF NOT EXISTS camp_details(
    spot_id UUID PRIMARY KEY REFERENCES spots(id) ON DELETE CASCADE,
    is_for_cars BOOLEAN,
    has_shower BOOLEAN,
    swimming_available BOOLEAN
);
