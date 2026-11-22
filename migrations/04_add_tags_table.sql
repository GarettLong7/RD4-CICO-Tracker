USE cico_tracker;

-- 2. DDL: Create the tag lookup table.
CREATE TABLE tags (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL
) ENGINE = INNODB;

-- 4. DML: Seed the tags displayed in the Express forms.
INSERT INTO tags (name) VALUES
    ('Vegan'),
    ('Vegetarian'),
    ('Gluten-Free'),
    ('Low Carb'),
    ('Low Fat');

-- 2. DDL: Create the junction table that links food entries to many tags.
CREATE TABLE food_entries_tags (
    food_entry_id INT UNSIGNED NOT NULL,
    tag_id INT UNSIGNED NOT NULL,

    PRIMARY KEY (food_entry_id, tag_id),

    FOREIGN KEY (food_entry_id)
        REFERENCES food_entries(id)
        ON DELETE CASCADE,

    FOREIGN KEY (tag_id)
        REFERENCES tags(id)
        ON DELETE CASCADE
) ENGINE = INNODB;
