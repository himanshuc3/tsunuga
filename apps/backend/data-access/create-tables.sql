DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS user_identities;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS lesson_items;
DROP TABLE IF EXISTS user_item_progress;
DROP TABLE IF EXISTS user_settings;



CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
);

CREATE TABLE user_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_subject TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (provider, provider_subject)
);

CREATE TABLE lessons (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
);

CREATE TABLE lesson_items (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL REFERENCES lessons(id),
    kind TEXT NOT NULL CHECK(kind IN ('concept', 'vocab')),
    sort_order INTEGER NOT NULL,

    title TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    romaji TEXT NOT NULL DEFAULT '',
    en TEXT NOT NULL DEFAULT '',
    meta TEXT NOT NULL DEFAULT '',

    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (lesson_id, sort_order)
);

CREATE INDEX lesson_items_order_idx 
ON lesson_items (lesson_id, sort_order);

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
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
