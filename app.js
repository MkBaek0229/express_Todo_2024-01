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


app.get("/todo/:id", async (req, res) => {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM Todo WHERE id = ?"
    , [
     id,
    ]);

    if (rows.length == 0) {
        res.status(404).send("not found");
      }
    
    res.json(rows[0]);
  });



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})