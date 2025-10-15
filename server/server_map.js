// server/server_map.js
require("dotenv").config({ path: __dirname + "/../.env" });
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");
const { router: mapRouter, setSupabase } = require("./routes/map");

const app = express();
app.disable("x-powered-by");

const PORT = process.env.PORT || 3000;

// ---------- 파일 경로 ----------
const indexPath = path.join(__dirname, "../source/pages/index/index.html");
const mapPath = path.join(__dirname, "../source/pages/map/map_page.html");
const myPagePath = path.join(__dirname, "../source/pages/my-page/my-page.html");
const authPath = path.join(__dirname, "../public/auth/login-demo.html");
const aiCoursePath = path.join(
  __dirname,
  "../source/pages/aiCourse/aiSchedule.html"
);
const preferencePath = path.join(
  __dirname,
  "../source/pages/preference/preference.html"
);

console.log("Index 경로:", indexPath, "존재:", fs.existsSync(indexPath));
console.log("Map   경로:", mapPath, "존재:", fs.existsSync(mapPath));

// ---------- Supabase ----------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Map 라우터에 supabase 클라이언트 주입
setSupabase(supabase);

// ---------- 공통 미들웨어 ----------
app.use(cors());
app.use(express.json());

// CSP 헤더 설정 (통합본)
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    [
      // 기본
      "default-src 'self' https: data: blob:",

      // 스크립트: Supabase ESM, jsDelivr, Kakao/Daum, unpkg 등
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh https://cdn.jsdelivr.net https://dapi.kakao.com https://t1.daumcdn.net http://t1.daumcdn.net https://unpkg.com",

      // 스타일/폰트 CDN
      "style-src 'self' 'unsafe-inline' https: https://fonts.googleapis.com https://unpkg.com",
      "font-src 'self' https: data: https://fonts.gstatic.com",

      // API / Realtime / 개발 서버(로컬) 허용
      "connect-src 'self' http://localhost:3000 https: wss:",

      // 이미지/동영상 등
      "img-src 'self' https: http: data: blob:",

      // OAuth/지도 등 외부 프레임 대비
      "frame-src https:"
    ].join("; ")
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
app.use(
  "/my-page",
  express.static(path.join(__dirname, "../source/pages/my-page"))
);
// Bootstrap과 jQuery를 루트 경로에서 제공
app.use("/bootstrap", express.static(path.join(__dirname, "../bootstrap")));
app.use("/jquery", express.static(path.join(__dirname, "../jquery")));

// 메인 페이지
app.get("/", (_req, res) => {
  if (!fs.existsSync(indexPath))
    return res.status(404).send("index.html을 찾을 수 없습니다");
  if (!fs.existsSync(indexPath))
    return res.status(404).send("index.html을 찾을 수 없습니다");
  res.sendFile(indexPath);
});

// (옵션) 간단한 /map 라우트
app.get("/map", (_req, res) => {
  if (!fs.existsSync(mapPath))
    return res.status(404).send("map_page.html을 찾을 수 없습니다");
  if (!fs.existsSync(mapPath))
    return res.status(404).send("map_page.html을 찾을 수 없습니다");
  res.sendFile(mapPath);
});

// ---------- 유틸 ----------
function parseCoordinates(coordStr) {
  if (!coordStr) return null;
  const parts = coordStr.split(",").map((s) => s.trim());
  const lat = parseFloat(parts[0].replace("N", "").replace("S", "-"));
  const lng = parseFloat(parts[1].replace("E", "").replace("W", "-"));
  return { lat, lng };
}

// ---------- API: 장소 검색 (location) ----------
app.get("/api/search", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "검색어가 필요합니다." });

  try {
    const { data: locations, error } = await supabase
      .from("location")
      .select("*")
      .or(
        `placeName.ilike.%${q}%,mediaTitle.ilike.%${q}%,address.ilike.%${q}%,keyword.ilike.%${q}%`
      )
      .limit(20);

    if (error) throw error;

    const documents = (locations || []).map((loc) => {
      const coords = parseCoordinates(loc.coordinates);
      return {
        place_name: loc.placeName,
        address_name: loc.address || "",
        x: coords ? coords.lng : 126.978,
        y: coords ? coords.lat : 37.5665,
        place_id: loc.placeId,
        media_title: loc.mediaTitle,
        description: loc.description,
        image_url: loc.imageUrl,
        format: loc.format,
        rating: loc.rating,
      };
    });

    res.json({ documents });
  } catch (e) {
    console.error("❌ /api/search:", e);
    res.status(500).json({ error: "검색 중 오류 발생" });
  }
});

// ---------- API: 콘텐츠로 장소 검색 ----------
app.get("/api/search-by-content", async (req, res) => {
  const contentName = req.query.name;
  if (!contentName)
    return res.status(400).json({ error: "콘텐츠 이름이 필요합니다." });

  try {
    // 1) contents에서 해당 콘텐츠의 name(location) 모으기
    const { data: contentRows, error: contentErr } = await supabase
      .from("contents")
      .select("name")
      .eq("contents", contentName);

    if (contentErr) throw contentErr;
    if (!contentRows?.length) return res.json({ documents: [] });

    const locationNames = [
      ...new Set(contentRows.map((r) => r.name).filter(Boolean)),
    ];

    // 2) location에서 placeName 매칭
    const { data: locations, error: locErr } = await supabase
      .from("location")
      .select("*")
      .in("placeName", locationNames);

    if (locErr) throw locErr;

    const unique = [
      ...new Map((locations || []).map((it) => [it.placeName, it])).values(),
    ];

    const documents = unique.map((loc) => {
      const coords = parseCoordinates(loc.coordinates);
      return {
        place_name: loc.placeName,
        address_name: loc.address || "",
        x: coords ? coords.lng : 126.978,
        y: coords ? coords.lat : 37.5665,
        place_id: loc.placeId,
        media_title: loc.mediaTitle,
        description: loc.description,
        image_url: loc.imageUrl,
        format: loc.format,
      };
    });

    res.json({ documents });
  } catch (e) {
    console.error("❌ /api/search-by-content:", e);
    res.status(500).json({ error: "검색 중 오류 발생" });
  }
});

// ---------- API: 콘텐츠 목록 ----------
app.get("/api/contents", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("contents")
      .select("contentsId, contents, name, location, explanation, contentGroup")
      .limit(50);

    if (error) throw error;
    res.json(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error("❌ /api/contents:", e);
    res.status(500).json({ error: "콘텐츠 조회 실패" });
  }
});

// aiCourse 페이지
app.get("/aiCourse", (_req, res) => {
  if (!fs.existsSync(aiCoursePath))
    return res.status(404).send("aiSchedule.html을 찾을 수 없습니다");
  res.sendFile(aiCoursePath);
});

// 선호도 조사 페이지
app.get("/preference", (_req, res) => {
  if (!fs.existsSync(preferencePath))
    return res.status(404).send("preference.html을 찾을 수 없습니다");
  res.sendFile(preferencePath);
});

// 로그인 페이지
app.get("/auth", (_req, res) => {
  if (!fs.existsSync(authPath))
    return res.status(404).send("login-demo.html을 찾을 수 없습니다");
  res.sendFile(authPath);
});

// 마이페이지
app.get("/my-page", (_req, res) => {
  if (!fs.existsSync(myPagePath))
    return res.status(404).send("my-page.html을 찾을 수 없습니다");
  res.sendFile(myPagePath);
});

// API 라우트 연결
app.use("/api", mapRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
