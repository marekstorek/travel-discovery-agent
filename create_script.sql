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
    longitude FLOAT,
    details JSONB DEFAULT '{}'::jsonb
);
