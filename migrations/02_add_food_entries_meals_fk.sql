USE cico_tracker;

-- 2. DDL: Add the meal column and link it to the meal lookup table.
ALTER TABLE food_entries
    ADD COLUMN meal_id INT UNSIGNED NULL DEFAULT NULL,
    ADD CONSTRAINT fk_food_entries_meals
        FOREIGN KEY (meal_id) REFERENCES meals(id)
        ON DELETE SET NULL;
