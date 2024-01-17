import express from 'express';
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "alsrl6678",
  password: "alsrl1004",
  database: "todo",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

const app = express()
app.use(express.json());
const port = 3000

// 유저가 작성한 데이터 조회
app.get("/:username/todos", async (req, res) => {
  const {username} = req.params;

  const [rows] = await pool.query(
  `
  SELECT member.name AS 회원이름, todo.contents AS 할일내역
  FROM member
  JOIN todo_member ON member.id = todo_member.member_id
  JOIN todo ON todo_member.todo_id = todo.id
  WHERE member.name = ?
  `,
  [username]
  );
  res.json({
    resultCode: "S-1",
    msg: "성공",
    data: rows,
  });
});

// 단건조회
app.get("/:id/todos", async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query("SELECT * FROM Todo WHERE id = ?", [id]);

  if (rows.length == 0) {
    res.status(404).json
    ({
      resultCode: "F-1",
      msg: "실패",
    });
    
    return;
  }

  res.json({
    resultCode: "S-1",
    msg: "성공",
    data: rows,
  });
});

//생성
app.post("/todos", async (req, res) => {
  const { contents, completed } = req.body;

  if (!contents) {
    res.status(400).json({
      msg: "contents required",
    });
    return;
  }

  if (typeof completed === 'undefined') {
    res.status(400).json({
      resultCode: "F-1",
      msg: "실패",
    });
    return;
  }

  const [rs] = await pool.query(
    `
    INSERT INTO Todo
    SET contents = ?,
    completed = ?
    `,
    [contents, completed]
  );

  res.status(201).json({
    resultCode: "S-1",
    msg: "성공",
    data: rows,
  });
});

//수정
app.patch("/:id/todos", async (req, res) => {
  const { id } = req.params;
  const { contents, completed } = req.body;

  const [rows] = await pool.query("SELECT * FROM Todo WHERE id = ?", [id]);

  if (rows.length == 0) {
    res.status(404).send("not found");
    return;
  }

  if (!contents) {
    res.status(400).json({
      resultCode: "F-1",
      msg: "실패",
    });
    return;
  }

  if (typeof completed === 'undefined') {
    res.status(400).json({
      resultCode: "F-1",
      msg: "실패",
    });
    return;
  }

  const [rs] = await pool.query(
    ` 
    UPDATE Todo
    SET 
    contents = ?,
    completed = ?
    WHERE id = ? 
    `,
    [contents, completed, id]
  );

  res.status(201).json({
    resultCode: "S-1",
    msg: "성공",
    data: rows,
  });
});

//삭제
app.delete("/:id/todo", async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query("SELECT * FROM Todo WHERE id = ?", [id]);

  if (rows.length == 0) {
    rres.status(400).json({
      resultCode: "F-1",
      msg: "실패",
    });
    return;
  }

  const [rs] = await pool.query(
    ` 
    DELETE FROM Todo
    WHERE id = ? 
    `,
    [id]
  );

  res.status(200).json({
    resultCode: "F-1",
    msg: `${id}번 할일을 삭제하였습니다`,
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})