import express from 'express';
import cors  from 'cors';
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
app.use(cors());
app.use(express.json());
const port = 3000

// 할일 조회 API
app.get("/:username/todos", async (req, res) => {
  const {username} = req.params;

  const [todosrows] = await pool.query(
  `
  SELECT member.name AS 회원이름, todo.contents AS 할일내역
  FROM member
  JOIN todo_member ON member.id = todo_member.member_id
  JOIN todo ON todo_member.todo_id = todo.id
  WHERE member.name = ?
  `,
  [username]
  );
// 데이터 요청이 올바르게 되지 않았을시에 실패 메시지 반환
  if (todosrows.length == 0) {
    res.status(404).json
    ({
      resultCode: "F-1",
      msg: "해당 회원이 존재하지 않거나 올바르게 작성되지않았습니다.",
    });
    return;
  }

  res.json({
    resultCode: "S-1",
    msg: "성공",
    data: todosrows,
  });
});

// 단건조회 API
app.get("/:username/todos/:no", async (req, res) => {
  const { username , no} = req.params;
  const [todorows] = await pool.query(
    `
    SELECT member.name AS 회원이름, todo.contents AS 할일내역
    FROM member
    JOIN todo_member ON member.id = todo_member.member_id
    JOIN todo ON todo_member.todo_id = todo.id
    WHERE member.name = ?
    AND todo.id = ?
    `,
    [username , no]
    );

  if (todorows.length == 0) {
    res.status(404).json
    ({
      resultCode: "F-1",
      msg: "해당 번호로 작성된 todo가 없습니다.",
    });
    
    return;
  }

  res.json({
    resultCode: "S-1",
    msg: "성공",
    data: todorows,
  });
});

// 할일 생성 API
app.post("/:username/todos/", async (req, res) => {
  const { username } = req.params;
  const { contents, completed = 0 } = req.body;

  // 할일 내용이 없는 경우 실패 응답
  if (!contents) {
    res.status(400).json({
      resultCode: "F-1",
      msg: "할일내용을 작성해주세요",
    });
    return;
  }

  try {
    // 데이터 생성: todo 테이블에 새로운 할일 추가
    const [insertTodoRs] = await pool.query(
      `
      INSERT INTO todo (contents, completed) VALUES (?, ?);
      `,
      [contents, completed]
    );

    // 새로 생성된 할일의 ID
    const todoId = insertTodoRs.insertId;

    // 할일과 회원 매핑: todo_member 테이블에 새로운 할일과 회원의 매핑 정보 추가
    await pool.query(
      `
      INSERT INTO todo_member (member_id, todo_id) VALUES (
        (SELECT id FROM member WHERE name = ?),
        ?
      );
      `,
      [username, todoId]
    );

    // 생성된 할일 정보 조회
    const [[justCreatedTodoRow]] = await pool.query(
      `
      SELECT *
      FROM todo
      WHERE id = ?
      `,
      [todoId]
    );

    // 성공 응답
    res.json({
      resultCode: "S-1",
      msg: `${justCreatedTodoRow.id}번 할일을 생성하였습니다`,
      data: justCreatedTodoRow,
    });
  } catch (error) {
    console.error("에러 발생:", error);

    // 실패 응답
    res.status(500).json({
      resultCode: "F-1",
      msg: "서버 에러",
    });
  }
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
app.delete("/:username/todos/:no", async (req, res) => {
  const { username , no} = req.params;  

  const [todorows] = await pool.query(
    ` 
    DELETE FROM todo
    WHERE id = ?
      AND id IN (
        SELECT todo_id
        FROM todo_member
        WHERE member_id = (
          SELECT id
          FROM member
          WHERE name = ?
          )
      )
    `,
    [no,username]
  );
  if (todorows.length == 0) {
    res.status(400).json({
      resultCode: "F-1",
      msg: "해당 todo는 존재하지 않습니다",
    });
    return;
  }

  

  res.status(200).json({
    resultCode: "F-1",
    msg: `${no}번 할일을 삭제하였습니다`,
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})