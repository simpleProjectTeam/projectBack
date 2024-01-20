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


const formatPrices = (prices) => {
  return prices.map((item) => ({
    ...item,
    price: `${Number(item.price).toLocaleString()}`,
  })); //소수점 제거를 위한 공용
};

// 조회
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

    const formattedPrices = formatPrices(prices);

    res.json({
      resultCode: "S-1",
      msg: "성공",
      data: formattedPrices,
    });

  } catch (error) {
    console.error("데이터베이스 쿼리 실행 중 오류:", error);
    res.status(500).json({
      resultCode: "F-1",
      msg: "서버 오류",
    });
  }
});

// 단건조회
app.get("/:user_code/account/:no", async (req, res) => {
  const { user_code, no } = req.params;

  try {
    const [prices] = await pool.query(
      `
      SELECT *
      FROM accountBook
      WHERE user_code = ?
      AND no = ?
      `,
      [user_code, no]
    );

    const formattedPrices = formatPrices(prices);

    if (!formattedPrices.length) {
      res.status(404).json({
        resultCode: "F-1",
        msg: "실패",
      });
      return;
    }

    res.json({
      resultCode: "S-1",
      msg: "성공",
      data: formattedPrices,
    });

  } catch (error) {
    console.error("데이터베이스 쿼리 실행 중 오류:", error);
    res.status(500).json({
      resultCode: "F-2",
      msg: "서버 오류",
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});