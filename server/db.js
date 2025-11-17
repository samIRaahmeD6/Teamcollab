const mysql = require("mysql2");

// const db = mysql.createConnection({
//   host: "localhost",
//   user: "hasipyds_team-collab",         // your MySQL username
//   password: "te@mcoll@b",         // your MySQL password
//   database: "hasipyds_teamColab", // your database name
//   port: 3306
// });

const db = mysql.createConnection({
  host: "localhost",
  user: "root",         // your MySQL username
  password: "",         // your MySQL password
  database: "teamcollab", // your database name
  port: 3306
});
db.connect(err => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL Database");
  }
});

module.exports = db;