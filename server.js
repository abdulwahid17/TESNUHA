const express = require("express");
const pool = require("./db"); 
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;
const SECRET_KEY = "key"; 

app.use(express.json());



app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // cari user
    const result = await pool.query(
      "SELECT * FROM tbl_user WHERE username = $1 AND password = $2",
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Username atau password salah" });
    }

    const user = result.rows[0];

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, {
      expiresIn: "1h",
    });

    res.json({ message: "Login berhasil", token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});


function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.get("/menus", authenticateToken, async (req, res) => {
  try {
    const username = req.user.username; 

    const result = await pool.query(
      "SELECT m.menu_id, m.menu_name, m.parent_id, m.url, m.sort_order FROM tbl_user u JOIN user_role ur ON u.user_id = ur.user_id JOIN role_menu rm ON ur.role_id = rm.role_id JOIN tbl_menu m ON rm.menu_id = m.menu_id WHERE u.username = $1 ORDER BY m.parent_id, m.sort_order",
      [username]
    );

      const flatMenus = result.rows;
      const menuTree = buildMenuTree(flatMenus);
      res.json(menuTree);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

function buildMenuTree(menus, parentId = null) {
  return menus
    .filter(menu => menu.parent_id === parentId)
    .map(menu => ({
      menu,
      children: buildMenuTree(menus, menu.menu_id)
    }));
}





app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
