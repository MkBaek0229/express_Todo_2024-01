import express from 'express';
import mysql2 from "mysql2/promise";

const pool = mysql2.createPool({
  host: "localhost",
  user: "alsrl6678",
  password: "alsrl1004",
  database: "TodoService",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const app = express()
app.use(express.json());
const port = 3000

const Todo = [
  {
    content:"하루밥 5끼먹기",
    completed:false,
  },
  {
    content:"하루종일 누워있기",
    completed:false,
  }
]

app.get('/', (req, res) => {
  res.send(Todo)
});

app.get("/todo", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM Todo ORDER BY id DESC");

  res.json(rows);
});

// id에 맞는 하나의 데이터만 get 요청
app.get("/todo/:id", async (req, res) => {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM Todo WHERE id = ?"
    , [
     id,
    ]);

    if (rows.length == 0) {
        res.status(404).send("not found");
        return;
      }
    
    res.json(rows[0]);
  });

// 할일 등록
app.post("/todo", async (req, res) => {
    const { member_id, contents, completed } = req.body;
  
    if (!member_id) {
      res.status(400).json({
        msg: "memberID required",
      });
      return;
    }
  
    if (!contents) {
      res.status(400).json({
        msg: "contents required",
      });
      return;
    }

    if (!completed) {
        res.status(400).json({
          msg: "completed required",
        });
        return;
      }
  
    const [rs] = await pool.query(
      `
      INSERT INTO Todo
      SET member_id = ?,
      contents = ?,
      completed = ?
      `,
      [member_id, contents, completed]
    );
  
    res.status(201).json({
      id: rs.insertId,
    });
  });
  

  // 할일 수정
app.patch("/todo/:id", async (req, res) => {

    const { id } = req.params;

    const { contents, completed } = req.body;

    const [rows] = await pool.query("SELECT * FROM Todo WHERE id = ?", [id]);

      if (rows.length == 0) {
        res.status(404).send("not found");
        return;
      }
    
  
    if (!contents) {
      res.status(400).json({
        msg: "contents required",
      });
      return;
    }

    if (typeof completed === 'undefined') {
        res.status(400).json({
            msg: "completed required",
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
      [contents, completed , id]
    );
  
    res.status(200).json({
      id,
      contents,
      completed
    });
  });
  

  // 할일 삭제
  app.delete("/todo/:id", async (req, res) => {

    const { id } = req.params;

   
    const [rows] = await pool.query("SELECT * FROM Todo WHERE id = ?", [id]);

      if (rows.length == 0) {
        res.status(404).send("not found");
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
      id
    });
  });
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})