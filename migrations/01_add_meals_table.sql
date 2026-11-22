USE cico_tracker;

-- 2. DDL: Create the meal lookup table.
CREATE TABLE meals (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
) ENGINE = INNODB;

-- 4. DML: Seed the meal choices used by the Express forms.
INSERT INTO meals (id, name) VALUES
    (1, 'N/A'),
    (2, 'Breakfast'),
    (3, 'Lunch'),
    (4, 'Dinner'),
    (5, 'Snack');
