import express from "express";
import cors from "cors";
import pkg from 'pg';

const app = express();
const port = 3000;
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: 'tC0jGfxzQ4UoE6x',
  host: 'robe-pojectback-db.internal',
  database: 'postgres',
  port: 5432,
});

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

const formatPrices = (prices) => {
  return prices.map((item) => ({
    ...item,
    price: `${Number(item.price).toLocaleString()}`,
  }));
};

// 조회
app.get("/:user_code/account", async (req, res) => {
  const { user_code } = req.params;

  try {
    const { rows: prices } = await pool.query(
      `
      SELECT *
      FROM accountBook
      WHERE user_code = $1
      ORDER BY id ASC
      `,
      [user_code]
    );

    const formattedPrices = formatPrices(prices);

    if (!formattedPrices.length) {
      res.status(404).json({
        resultCode: "F-1",
        msg: "조회 실패",
      });
      return;
    }
    res.json({
      resultCode: "S-1",
      msg: "조회 성공",
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
    const { rows: prices } = await pool.query(
      `
      SELECT *
      FROM accountBook
      WHERE user_code = $1
      AND no = $2
      `,
      [user_code, no]
    );

    const formattedPrices = formatPrices(prices);

    if (!formattedPrices.length) {
      res.status(404).json({
        resultCode: "F-1",
        msg: "단건 조회 실패",
      });
      return;
    }

    res.json({
      resultCode: "S-1",
      msg: "단건 조회 성공",
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

// 삭제
app.delete("/:user_code/account/:no", async (req, res) => {
  const { user_code, no } = req.params;

  try {
    const { rows: prices } = await pool.query(
      `
      SELECT *
      FROM accountBook
      WHERE user_code = $1
      AND no = $2
      `,
      [user_code, no]
    );

    const formattedPrices = formatPrices(prices);

    if (!formattedPrices.length) {
      res.status(404).json({
        resultCode: "F-1",
        msg: "삭제 실패",
      });
      return;
    }

    await pool.query(
      `
      DELETE FROM accountBook
      WHERE user_code = $1
      AND no = $2
      `,
      [user_code, no]
    );

    res.json({
      resultCode: "S-1",
      msg: `${no}번 내용을 삭제하였습니다.`,
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

// 업데이트
app.post("/:user_code/account", async (req, res) => {
  const { user_code } = req.params;
  const { content, price } = req.body;

  try {
    const { rows: lastPrice } = await pool.query(
      `
      SELECT *
      FROM accountBook
      WHERE user_code = $1
      ORDER BY no DESC
      LIMIT 1
      `,
      [user_code]
    );

    const no = (lastPrice && lastPrice[0]?.no + 1) || 1;

    const { rows: insertedPrice } = await pool.query(
      `
      INSERT INTO accountBook (reg_date, update_date, modify_date, user_code, no, content, price)
      VALUES (NOW(), NOW(), NULL, $1, $2, $3, $4)
      RETURNING *
      `,
      [user_code, no, content, price]
    );

    if (!content) {
      res.status(404).json({
        resultCode: "F-1",
        msg: "내용 없음",
      });
      return;
    }
    if (!price) {
      res.status(404).json({
        resultCode: "F-1",
        msg: "가격 없음",
      });
      return;
    }

    res.json({
      resultCode: "S-1",
      msg: `${no}번 내용을 업데이트하였습니다.`,
      data: insertedPrice,
    });
  } catch (error) {
    console.error("데이터베이스 쿼리 실행 중 오류:", error);
    res.status(500).json({
      resultCode: "F-2",
      msg: "서버 오류",
    });
  }
});

// 수정
app.patch("/:user_code/account/:no", async (req, res) => {
  const { user_code, no } = req.params;
  const { content, price } = req.body;

  try {
    const { rows: prices } = await pool.query(
      `
      SELECT *
      FROM accountBook
      WHERE user_code = $1
      AND no = $2
      `,
      [user_code, no]
    );

    if (!prices.length) {
      res.status(404).json({
        resultCode: "F-1",
        msg: "수정 대상이 없습니다.",
      });
      return;
    }

    await pool.query(
      `
      UPDATE accountBook
      SET modify_date = NOW(),
      content = $1,
      price = $2
      WHERE user_code = $3
      AND no = $4
      RETURNING *
      `,
      [content, price, user_code, no]
    );

    const { rows: justModifiedPrice } = await pool.query(
      `
      SELECT *
      FROM accountBook
      WHERE user_code = $1
      AND no = $2
      `,
      [user_code, no]
    );

    const formattedPrices = formatPrices(justModifiedPrice);

    res.json({
      resultCode: "S-1",
      msg: `${no}번 수정을 하였습니다.`,
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