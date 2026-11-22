USE cico_tracker;

-- 4. DML: Assign existing entries to the N/A meal before making meal_id required.
UPDATE food_entries SET meal_id = 1;

-- 2. DDL: Require a meal and prevent deletion of meals that entries reference.
ALTER TABLE food_entries
    DROP FOREIGN KEY fk_food_entries_meals;

ALTER TABLE food_entries
    MODIFY COLUMN meal_id INT UNSIGNED NOT NULL DEFAULT 1;

ALTER TABLE food_entries
    ADD CONSTRAINT fk_food_entries_meals
        FOREIGN KEY (meal_id) REFERENCES meals(id)
        ON DELETE RESTRICT;
