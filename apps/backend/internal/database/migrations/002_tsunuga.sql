-- Write your migrate up statements here

CREATE TABLE users (
    -- Base fields for all tables
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,

    auth_method TEXT NOT NULL
        CHECK (auth_method IN ('password', 'google')),

    password_hash TEXT,
    google_subject TEXT UNIQUE,

    CHECK (
        (auth_method = 'password'
            AND password_hash IS NOT NULL
            AND google_subject IS NULL)
        OR
        (auth_method = 'google' 
            AND password_hash IS NULL
            AND google_subject IS NOT NULL)
    )
);

CREATE TABLE lessons (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    title TEXT NOT NULL,
    -- Order in which lessons are evaludated
    position INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
);

CREATE TABLE lesson_items (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,


    lesson_id TEXT NOT NULL REFERENCES lessons(id),
    kind TEXT NOT NULL CHECK(kind IN ('concept', 'vocab')),
    -- Order in which items inside a lesson are evaluated
    position INTEGER NOT NULL,

    title TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    romaji TEXT NOT NULL DEFAULT '',
    en TEXT NOT NULL DEFAULT '',
    meta TEXT NOT NULL DEFAULT '',
    active BOOLEAN NOT NULL DEFAULT TRUE,

    UNIQUE (lesson_id, sort_order)
);

CREATE INDEX lesson_items_order_idx 
ON lesson_items (lesson_id, position);

CREATE TABLE user_item_progress (

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    item_id TEXT NOT NULL REFERENCES lesson_items(id),
    introduced_at TIMESTAMPTZ,
    correct_streak INTEGER NOT NULL DEFAULT 0 CHECK (correct_streak >= 0),
    last_seen_at TIMESTAMPTZ,
    concept_shown BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,

    PRIMARY KEY (user_id, item_id)
);

CREATE INDEX user_item_progress_user_idx
ON user_item_progress (user_id);

CREATE TABLE user_settings(
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
);



---- create above / drop below ----

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
