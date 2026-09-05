INSERT INTO users (id, email, display_name)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'dev@example.com',
    'Development User'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_identities (
    user_id,
    provider,
    provider_subject
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'local',
    'dev-user'
)
ON CONFLICT (provider, provider_subject) DO NOTHING;