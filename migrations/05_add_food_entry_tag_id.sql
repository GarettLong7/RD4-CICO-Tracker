USE cico_tracker;

-- Keep each food entry and tag pair unique.
ALTER TABLE food_entries_tags
    ADD UNIQUE KEY uq_food_entry_tag (food_entry_id, tag_id);

-- Give each row its own unsigned integer primary key.
ALTER TABLE food_entries_tags
    DROP PRIMARY KEY,
    ADD COLUMN id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST;