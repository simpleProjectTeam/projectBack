import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();
const port = 3000;

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "project",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});


const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/:user_code/account", async (req, res) => {
  const { user_code } = req.params;

  try {
    const [prices] = await pool.query(
      `
      SELECT *
      FROM accountBook
      WHERE user_code = ?
      ORDER BY id ASC
      `,
      [user_code]
    );

    const formattedPrices = prices.map((item) => ({
      ...item,
      price: `${Number(item.price).toLocaleString()}`,
    }));

    res.json({
      resultCode: "S-1",
      msg: "성공",
      data: formattedPrices,
    });
  } catch (error) {
    console.error("Error fetching data from accountBook:", error);
    res.status(500).json({
      resultCode: "F-1",
      msg: "서버 오류",
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});