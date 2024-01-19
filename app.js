// app.js
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/about", (req, res) => {
  res.send("About!");
});

app.get("/setting", (req, res) => {
  res.send("Setting!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});