// 1. Node.js setup: load dependencies, configure Express, and create the MySQL pool.
const express = require("express");
const mysql2 = require("mysql2/promise");
const expressLayouts = require("express-ejs-layouts");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));

// Read submitted form data.
app.use(express.urlencoded({ extended: true }));

// Configure EJS and the shared layout.
app.set("view engine", "ejs");
app.set("views", "./views");
app.set("layout", "layout");
app.locals.pageTitle = "Food Entries";
app.use(expressLayouts);

// Configure the database connection.
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: true,
    port: process.env.DB_PORT
};

const dbConnection = mysql2.createPool(dbConfig);

// 5. Express CRUD backend — Read: GET / lists entries and filters by food name.
// DQL uses SELECT to read entries and GROUP_CONCAT to show their tags in one row.
app.get("/", async (req, res) => {
    const searchTerm =
        typeof req.query.search === "string" ? req.query.search.trim() : "";
    const mealFilter =
        typeof req.query.meal === "string" ? req.query.meal : "";

    const [meals] = await dbConnection.execute(
        "SELECT id, name FROM meals ORDER BY id"
    );

    const query = `
        SELECT food_entries.id, dateTime, foodName, calories,
               servingSize, unit, meals.name AS meal,
               GROUP_CONCAT(tags.name) AS selected_tags
        FROM food_entries
        LEFT JOIN meals ON food_entries.meal_id = meals.id
        LEFT JOIN food_entries_tags
            ON food_entries_tags.food_entry_id = food_entries.id
        LEFT JOIN tags ON food_entries_tags.tag_id = tags.id
        WHERE food_entries.foodName LIKE ?
          AND (? = '' OR food_entries.meal_id = ?)
        GROUP BY food_entries.id, dateTime, foodName, calories,
                 servingSize, unit, meals.name
    `;

    const [rows] = await dbConnection.execute(query, [
        `%${searchTerm}%`,
        mealFilter,
        mealFilter
    ]);

    res.render("index", {
        pageTitle: "Food Entries",
        foodEntries: rows,
        meals,
        searchTerm,
        mealFilter
    });
});

// 5. Express CRUD backend — Create: GET displays the form and POST saves it.
app.get("/food-entry/create", async (req, res) => {
    const [meals] = await dbConnection.execute("SELECT * FROM meals");
    const [tags] = await dbConnection.execute("SELECT * FROM tags");

    res.render("create-food-entry", {
        pageTitle: "Add Food Entry",
        meals,
        tags
    });
});

// DML uses INSERT. The transaction saves the entry and its tags together.
app.post("/food-entry/create", async (req, res, next) => {
    const connection = await dbConnection.getConnection();

    try {
        await connection.beginTransaction();

        const {
            dateTime,
            foodName,
            calories,
            servingSize,
            meal,
            unit
        } = req.body;

        const query = `
            INSERT INTO food_entries
            (dateTime, foodName, calories, meal_id, servingSize, unit)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const values = [
            dateTime,
            foodName,
            calories,
            meal || "1",
            servingSize,
            unit
        ];

        const [results] = await connection.execute(query, values);
        const newFoodEntryID = results.insertId;

        const tags = [...new Set(req.body.tags || [])];

        for (let tagID of tags) {
            await connection.execute(
                `INSERT INTO food_entries_tags
                 (food_entry_id, tag_id) VALUES (?, ?)`,
                [newFoodEntryID, tagID]
            );
        }

        await connection.commit();

        res.redirect("/");
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
});

// 5. Express CRUD backend — Update: GET reads the entry and POST applies the edits.
app.get("/food-entry/:id/edit", async (req, res) => {
    const foodRecordID = req.params.id;

    const [foodEntries] = await dbConnection.execute(
        "SELECT * FROM food_entries WHERE id = ?",
        [foodRecordID]
    );

    const [foodEntryTags] = await dbConnection.execute(
        "SELECT * FROM food_entries_tags WHERE food_entry_id = ?",
        [foodRecordID]
    );

    const [meals] = await dbConnection.execute("SELECT * FROM meals");
    const [tags] = await dbConnection.execute("SELECT * FROM tags");

    res.render("edit-food-entry", {
        pageTitle: "Edit Food Entry",
        foodEntry: foodEntries[0],
        meals,
        tags,
        relatedTags: foodEntryTags.map(t => t.tag_id)
    });
});

// DML uses UPDATE and replaces the tag links within the same transaction.
app.post("/food-entry/:id/edit", async (req, res, next) => {
    const connection = await dbConnection.getConnection();

    try {
        await connection.beginTransaction();

        const foodEntryID = req.params.id;

        const query = `
            UPDATE food_entries
            SET dateTime = ?, foodName = ?, calories = ?,
                meal_id = ?, servingSize = ?, unit = ?
            WHERE id = ?
        `;

        const values = [
            req.body.dateTime,
            req.body.foodName,
            req.body.calories,
            req.body.meal || "1",
            req.body.servingSize,
            req.body.unit,
            foodEntryID
        ];

        await connection.execute(
            "DELETE FROM food_entries_tags WHERE food_entry_id = ?",
            [foodEntryID]
        );

        const tags = [...new Set(req.body.tags || [])];

        for (let tagID of tags) {
            await connection.execute(
                `INSERT INTO food_entries_tags
                 (food_entry_id, tag_id) VALUES (?, ?)`,
                [foodEntryID, tagID]
            );
        }

        await connection.execute(query, values);
        await connection.commit();

        res.redirect("/");
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
});

// 5. Express CRUD backend — Delete: GET shows confirmation and POST removes the entry.
app.get("/food-entry/:id/delete", async (req, res) => {
    const [rows] = await dbConnection.execute(
        "SELECT * FROM food_entries WHERE id = ?",
        [req.params.id]
    );

    res.render("delete-food-entry", {
        pageTitle: "Delete Food Entry",
        foodEntry: rows[0]
    });
});

// DML uses DELETE. The foreign key cascades the deletion to the entry's tag links.
app.post("/food-entry/:id/delete", async (req, res) => {
    await dbConnection.execute(
        "DELETE FROM food_entries WHERE id = ?",
        [req.params.id]
    );

    res.redirect("/");
});

// Start the server.
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
