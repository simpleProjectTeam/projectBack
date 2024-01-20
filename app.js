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

//삭제

app.delete("/:user_code/account/:no", async (req,res) => {
  const {user_code, no} = req.params;
  
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
        msg: "삭제실패",
      });
      return;
    }
    
    await pool.query(
      `
      DELETE FROM accountBook
      WHERE user_code = ?
      AND no = ?
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
})

//업데이트
app.post("/:user_code/account", async (req,res)=>{
  const {user_code} = req.params;

  const {content,price} = req.body;

  try {
    const [lastPrice] = await pool.query(
      `
      SELECT *
      FROM accountBook
      WHERE user_code = ?
      ORDER BY no DESC
      LIMIT 1
      `,
      [user_code]
    );

    const no = (lastPrice && lastPrice[0]?.no + 1) || 1;

    const [insertedPrice] = await pool.query(
      `
      INSERT INTO accountBook
      SET reg_date = NOW(),
          update_date = NOW(),
          modify_date = NULL,
          user_code = ?,
          no = ?,
          content = ?,
          price = ?
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
    
    const [createdPrice] = await pool.query(
      `
      SELECT *
      FROM accountBook
      WHERE no = ?
      `,
      [no]
    );
    

    res.json({
      resultCode: "S-1",
      msg: `${no}번 내용을 업데이트하였습니다.`,
      data: createdPrice,
    });

  } catch (error) {
    console.error("데이터베이스 쿼리 실행 중 오류:", error);
    res.status(500).json({
      resultCode: "F-2",
      msg: "서버 오류",
    });
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});