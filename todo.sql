
-- 할일 테이블 생성
CREATE TABLE todo (
    id serial PRIMARY KEY NOT NULL,
    contents varchar(100) NOT NULL,
    completed boolean NOT NULL DEFAULT FALSE
);

-- 시퀀스 생성
CREATE SEQUENCE member_id_seq START 1;

-- 회원 테이블 생성
CREATE TABLE member (
    id serial PRIMARY KEY DEFAULT,
    name varchar(10) NOT NULL,
    password varchar(20) NOT NULL UNIQUE,
    callnum varchar(13) NOT NULL
);


-- 할일_회원 테이블 생성 (할일, 회원 테이블의 매핑 테이블)
CREATE TABLE todo_member (
    member_id INT NOT NULL,
    todo_id INT NOT NULL,
    FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
    FOREIGN KEY (todo_id) REFERENCES todo(id) ON DELETE CASCADE
);

-- 회원 가입
INSERT INTO member (name, password, callnum) VALUES ('guu', '15152', '010-4338-1968');

-- 회원 삭제
DELETE FROM member WHERE id = 2;

-- 삭제된 회원 확인
SELECT * FROM member;

-- 할일 등록
INSERT INTO todo (contents, completed) VALUES ('todo 만들기', FALSE);

select * from todo;

-- 할일_회원 매핑
INSERT INTO todo_member (member_id, todo_id) VALUES (4, 4);

-- 할일 수정
UPDATE todo SET contents = '수정된 내용' WHERE id = 1;

-- 할일 삭제
DELETE FROM todo WHERE id = 1;
