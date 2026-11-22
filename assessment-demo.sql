-- Run after schema.sql and migrations 01 through 04.
USE cico_tracker;

-- DQL: Read food entries with their meal names.
SELECT f.id, f.dateTime, f.foodName, f.calories, m.name AS meal
FROM food_entries AS f
JOIN meals AS m ON m.id = f.meal_id
ORDER BY f.dateTime DESC, f.id DESC;

-- DQL: Find food entries by food name and meal.
SELECT f.id, f.foodName, f.calories, m.name AS meal
FROM food_entries AS f
JOIN meals AS m ON m.id = f.meal_id
WHERE f.foodName LIKE '%oatmeal%'
  AND m.id = 2
ORDER BY f.dateTime DESC, f.id DESC;

-- DQL: Aggregate entry counts and calories by date.
SELECT DATE(dateTime) AS entry_date,
       COUNT(*) AS entry_count,
       SUM(calories) AS total_calories,
       ROUND(AVG(calories), 2) AS average_calories
FROM food_entries
GROUP BY DATE(dateTime)
ORDER BY entry_date DESC;

-- SQL CRUD: CREATE with INSERT.
-- Run this block in one session. ROLLBACK discards the demo row changes.
START TRANSACTION;

INSERT INTO food_entries (dateTime, foodName, calories, servingSize, unit, meal_id)
VALUES (NOW(), 'Assessment Demo Oatmeal', 150, 1, 'serving', 2);

-- Save the generated ID so the remaining statements act on this entry only.
SET @demo_entry_id = LAST_INSERT_ID();

-- SQL CRUD: READ with SELECT (DQL).
SELECT id, foodName, calories
FROM food_entries
WHERE id = @demo_entry_id;

-- SQL CRUD: UPDATE with UPDATE.
UPDATE food_entries
SET calories = 180
WHERE id = @demo_entry_id;

SELECT id, foodName, calories
FROM food_entries
WHERE id = @demo_entry_id;

-- SQL CRUD: DELETE with DELETE.
DELETE FROM food_entries
WHERE id = @demo_entry_id;

SELECT COUNT(*) AS remaining_demo_entries
FROM food_entries
WHERE id = @demo_entry_id;

ROLLBACK;
