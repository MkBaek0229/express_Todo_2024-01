import express from 'express';
import cors from 'cors';
import pkg from 'pg';
//import jwt from 'jsonwebtoken';

const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  password: "QQmIjV5pH0QXG6u",
  host: "mktodo.internal",
  port: 5432, // PostgreSQL 기본 포트
  database: "postgres", 
});

const app = express();
const corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));
app.use(express.json());

const port = 3000;

pool.connect((err) => {
  if (err) {
    console.error('connection error', err.stack);
  } else {
    console.log('connected to postgres');
  }
});

// const generateToken = (userId) => {
//   // JWT 생성 
//   const token = jwt.sign({ userId }, 'your-secret-key', { expiresIn: '1h' });
//   return token;
// };


app.get("/", (req, res) => {
  res.send("new token world");
});

// 회원가입 API
app.post("/signup", async (req, res) => {
  const { username, password, callnum } = req.body;

  // 필수 정보 검증
  if (!username || !password || !callnum) {
    res.status(400).json({
      resultCode: "F-1",
      msg: "사용자 이름, 비밀번호, 전화번호를 모두 입력해주세요",
    });
    return;
  }

  try {
    // 사용자 등록
    const { rows } = await pool.query(
      `
      INSERT INTO member (name, password, callnum) VALUES ($1, $2, $3)
      RETURNING id;
      `,
      [username, password, callnum]
    );

    res.json({
      resultCode: "S-1",
      msg: "회원가입이 완료되었습니다",
      data: {
        userId: rows[0].id,
        username,
      },
    });
  } catch (error) {
    console.error("에러 발생:", error);
    // 중복된 사용자 이름 또는 다른 오류에 대한 처리
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        resultCode: "F-1",
        msg: "이미 존재하는 사용자 이름입니다",
      });
    } else {
      res.status(500).json({
        resultCode: "F-1",
        msg: "서버 에러",
      });
    }
  }
});

// 사용자 인증을 수행하는 미들웨어
const authenticateUser = async (req, res, next) => {
  const { username } = req.params;

  try {
    const { rows } = await pool.query(
      `
      SELECT id FROM member WHERE name = $1;
      `,
      [username]
    );

    if (rows.length === 0) {
      res.status(401).json({
        resultCode: "F-1",
        msg: "로그인이 필요합니다",
      });
      return;
    }

    req.userId = rows[0].id; // 로그인한 사용자의 ID를 저장
    next(); // 다음 미들웨어로 이동
  } catch (error) {
    console.error("에러 발생:", error);
    res.status(500).json({
      resultCode: "F-1",
      msg: "서버 에러",
    });
  }
};

// 사용자 로그인 체크 미들웨어를 관련된 라우트에 적용
app.use("/:username/todos", authenticateUser);

// 로그인 API
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // 필수 정보 검증
  if (!username || !password) {
    res.status(400).json({
      resultCode: "F-1", 
      msg: "사용자 이름과 비밀번호를 모두 입력해주세요",
    });
    return;
  }

  try {
    // 사용자 인증
    const { rows } = await pool.query(
      `
      SELECT id, name
      FROM member
      WHERE name = $1 AND password = $2;
      `,
      [username, password]
    );

    // 로그인 실패 시
    if (rows.length === 0) {
      res.status(401).json({
        resultCode: "F-1",
        msg: "사용자 이름 또는 비밀번호가 올바르지 않습니다",
      });
      return;
    }

    // // 로그인 성공 시
    // const userId = rows[0].id;
    // const token = generateToken(userId); // 토큰 생성 함수 호출

    res.json({
      resultCode: "S-1",
      msg: "로그인 성공",
      data: {
        userId,
        username,
        //token,
      },
    });
  } catch (error) {
    console.error("에러 발생:", error);
    res.status(500).json({
      resultCode: "F-1",
      msg: "서버 에러",
    });
  }
});


// 할일 조회 API
app.get("/:username/todos", async (req, res) => {
  const { username } = req.params;

  try {
    const { rows } = await pool.query(
      `
      SELECT todo.id, member.name, todo.contents , todo.completed
      FROM member
      JOIN todo_member ON member.id = todo_member.member_id
      JOIN todo ON todo_member.todo_id = todo.id
      WHERE member.name = $1;
      `,
      [username]
    );

    // 데이터 요청이 올바르게 되지 않았을 시에 실패 메시지 반환
    if (rows.length === 0) {
      res.status(404).json
      ({
        resultCode: "F-1",
        msg: "해당 회원이 존재하지 않거나 올바르게 작성되지 않았습니다.",
      });
      return;
    }

    res.json({
      resultCode: "S-1",
      msg: "성공",
      data: rows,
    });
  } catch (error) {
    console.error("에러 발생:", error);
    res.status(500).json({
      resultCode: "F-1",
      msg: "서버 에러",
    });
  }
});

// 단건조회 API
app.get("/:username/todos/:no", async (req, res) => {
  const { username, no } = req.params;

  try {
    const { rows } = await pool.query(
      `
      SELECT member.name AS 회원이름, todo.contents AS 할일내역, todo.completed AS 진행상태
      FROM member
      JOIN todo_member ON member.id = todo_member.member_id
      JOIN todo ON todo_member.todo_id = todo.id
      WHERE member.name = $1
      AND todo.id = $2;
      `,
      [username, no]
    );

    if (rows.length === 0) {
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
      data: rows,
    });
  } catch (error) {
    console.error("에러 발생:", error);
    res.status(500).json({
      resultCode: "F-1",
      msg: "서버 에러",
    });
  }
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

  // 사용자 정보를 통해 Todo를 생성함
  try {
    // 데이터 생성: todo 테이블에 새로운 할일 추가
    const { rows } = await pool.query(
      `
      INSERT INTO todo (contents, completed) VALUES ($1, $2)
      RETURNING id;
      `,
      [contents, completed]
    );

    // 새로 생성된 할일의 ID
    const todoId = rows[0].id;

    // 할일과 회원 매핑: todo_member 테이블에 새로운 할일과 회원의 매핑 정보 추가
    await pool.query(
      `
      INSERT INTO todo_member (member_id, todo_id) VALUES ($1, $2);

      `,
      [req.userId, todoId] // 수정된 부분: req.userId를 사용하여 현재 로그인한 사용자의 ID를 활용
    );

    // 생성된 할일 정보 조회
    const { rows: justCreatedTodoRow } = await pool.query(
      `
      SELECT *
      FROM todo
      WHERE id = $1;
      `,
      [todoId]
    );

    // 성공 응답
    res.json({
      resultCode: "S-1",
      msg: `${justCreatedTodoRow[0].id}번 할일을 생성하였습니다`,
      data: justCreatedTodoRow[0],
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

// 할일 수정 API
app.patch("/:username/todos/:no", async (req, res) => {
  try {
  const { username, no } = req.params; 
    // 해당 회원이 작성한 특정 번호의 할일을 조회
    const { rows } = await pool.query(
      `
      SELECT todo.id
      FROM member
      JOIN todo_member ON member.id = todo_member.member_id
      JOIN todo ON todo_member.todo_id = todo.id
      WHERE member.name = $1
        AND todo.id = $2;
      `,
      [username, no]
    );

    if (rows.length === 0) {
      res.status(404).json({
        resultCode: "F-1",
        msg: "해당 회원이 작성한 해당 번호의 할일이 존재하지 않습니다",
      });
      return;
    }
    const { completed } = req.body;

    // 할일 수정 쿼리 실행
    await pool.query(
      ` 
      UPDATE todo
      SET 
      completed = $1
      WHERE id = $2;
      `,
      [completed, no]
    );

    res.json({
      resultCode: "S-3",
      msg: "수정성공",
      data: rows[0],
  });
} catch (error) {
  console.error(error);
  res.status(500).json({
      resultCode: "F-1",
      msg: "에러 발생",
  });
}
});

// 할일 삭제 API
app.delete("/:username/todos/:no", async (req, res) => {
  try { 
  const { username, no } = req.params;

  const { rows } = await pool.query(
    `
    SELECT todo.id
    FROM member
    JOIN todo_member ON member.id = todo_member.member_id
    JOIN todo ON todo_member.todo_id = todo.id
    WHERE member.name = $1
      AND todo.id = $2;
    `,
    [username, no]
  );

  if (rows.length === 0) {
    res.status(404).json({
      resultCode: "F-1",
      msg: "해당 회원이 작성한 해당 번호의 할일이 존재하지 않습니다",
    });
    return;
  }

    await pool.query(
      ` 
      DELETE FROM todo
      WHERE id = $1
        AND id IN (
          SELECT todo_id
          FROM todo_member
          WHERE member_id = (
            SELECT id
            FROM member
            WHERE name = $2
          )
        );
      `,
      [no, username]
    );

    if (rows.length === 0) {
      res.status(400).json({
        resultCode: "F-1",
        msg: "해당 todo는 존재하지 않습니다",
      });
      return;
    }

    res.status(200).json({
      resultCode: "S-1",
      msg: `${no}번 할일을 삭제하였습니다`,
      data: rows[0],
    });
  } catch (error) {
    console.error("에러 발생:", error);
    res.status(500).json({
      resultCode: "F-1",
      msg: "서버 에러",
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
