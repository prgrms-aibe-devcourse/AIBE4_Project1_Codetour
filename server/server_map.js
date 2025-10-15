require("dotenv").config({ path: __dirname + "/../.env" });
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");
const { router: mapRouter, setSupabase } = require("./routes/map");

const app = express();
const PORT = process.env.PORT || 3000;

// 파일 경로 확인 (디버깅용)
const indexPath = path.join(__dirname, "../source/pages/index/index.html");
const mapPath = path.join(__dirname, "../source/pages/map/map_page.html");
const aiCoursePath = path.join(
  __dirname,
  "../source/pages/aiCourse/indexBae.html"
);
const preferencePath = path.join(
  __dirname,
  "../source/pages/preference/preference.html"
);
const authPath = path.join(__dirname, "../public/auth/login-demo.html");

console.log("Index 경로:", indexPath);
console.log("Index 파일 존재:", fs.existsSync(indexPath));
console.log("Map 경로:", mapPath);
console.log("Map 파일 존재:", fs.existsSync(mapPath));

// Supabase 연결
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Map 라우터에 supabase 클라이언트 주입
setSupabase(supabase);

app.use(cors());
app.use(express.json());

// CSP 헤더 설정을 먼저
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh https://dapi.kakao.com https://t1.daumcdn.net http://t1.daumcdn.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; connect-src 'self' https: wss:; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: http:;"
  );
  next();
});

// 정적 파일 제공
app.use(express.static(path.join(__dirname, "../public")));
app.use(
  "/source/pages/index",
  express.static(path.join(__dirname, "../source/pages/index"))
);
app.use(
  "/source/pages/map",
  express.static(path.join(__dirname, "../source/pages/map"))
);
app.use(
  "/aiCourse",
  express.static(path.join(__dirname, "../source/pages/aiCourse"))
);
app.use("/auth", express.static(path.join(__dirname, "../public/auth")));
// Bootstrap과 jQuery를 루트 경로에서 제공
app.use("/bootstrap", express.static(path.join(__dirname, "../bootstrap")));
app.use("/jquery", express.static(path.join(__dirname, "../jquery")));

// 메인 페이지
app.get("/", (req, res) => {
  if (!fs.existsSync(indexPath)) {
    return res.status(404).send("index.html을 찾을 수 없습니다");
  }
  res.sendFile(indexPath);
});

// 지도 페이지
app.get("/map", (req, res) => {
  if (!fs.existsSync(mapPath)) {
    return res.status(404).send("map_page.html을 찾을 수 없습니다");
  }
  res.sendFile(mapPath);
});

// aiCourse 페이지
app.get("/aiCourse", (req, res) => {
  if (!fs.existsSync(aiCoursePath)) {
    return res.status(404).send("indexBae.html을 찾을 수 없습니다");
  }
  res.sendFile(aiCoursePath);
});

// 선호도 조사 페이지
app.get("/preference", (req, res) => {
  if (!fs.existsSync(preferencePath)) {
    return res.status(404).send("preference.html을 찾을 수 없습니다");
  }
  res.sendFile(preferencePath);
});

// 로그인 페이지
app.get("/auth", (req, res) => {
  if (!fs.existsSync(authPath)) {
    return res.status(404).send("auth-index.html을 찾을 수 없습니다");
  }
  res.sendFile(authPath);
});

// API 라우트 연결
app.use("/api", mapRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});