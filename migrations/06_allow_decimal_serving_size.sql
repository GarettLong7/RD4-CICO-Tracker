USE cico_tracker;

ALTER TABLE food_entries
    MODIFY COLUMN servingSize DECIMAL(12,2) NOT NULL;