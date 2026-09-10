-- Write your migrate up statements here

ALTER TABLE lesson_items
	DROP CONSTRAINT lesson_items_lesson_id_fkey;

ALTER TABLE lessons
	ALTER COLUMN id TYPE UUID USING id::uuid,
	ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE lesson_items
	ALTER COLUMN lesson_id TYPE UUID USING lesson_id::uuid;

ALTER TABLE lesson_items
	ADD CONSTRAINT lesson_items_lesson_id_fkey
	FOREIGN KEY (lesson_id) REFERENCES lessons(id);

---- create above / drop below ----

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.

ALTER TABLE lesson_items
	DROP CONSTRAINT lesson_items_lesson_id_fkey;

ALTER TABLE lesson_items
	ALTER COLUMN lesson_id TYPE TEXT USING lesson_id::text;

ALTER TABLE lessons
	ALTER COLUMN id DROP DEFAULT,
	ALTER COLUMN id TYPE TEXT USING id::text;

ALTER TABLE lesson_items
	ADD CONSTRAINT lesson_items_lesson_id_fkey
	FOREIGN KEY (lesson_id) REFERENCES lessons(id);
