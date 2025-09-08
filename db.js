const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "202.10.56.226",
  database: "TES",
  password: "d3vkk4ma",
  port: 5432,
});

module.exports = pool;
