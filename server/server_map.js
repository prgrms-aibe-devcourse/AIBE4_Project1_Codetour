// server/server_map.js
require("dotenv").config({ path: __dirname + "/../.env" });
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");

const app = express();
app.disable("x-powered-by");

const PORT = process.env.PORT || 3000;

// ---------- 파일 경로 ----------
const indexPath = path.join(__dirname, "../source/pages/index/index.html");
const mapPath = path.join(__dirname, "../source/pages/map/map_page.html");

console.log("Index 경로:", indexPath, "존재:", fs.existsSync(indexPath));
console.log("Map   경로:", mapPath, "존재:", fs.existsSync(mapPath));

// ---------- Supabase ----------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ---------- 공통 미들웨어 ----------
app.use(cors());
app.use(express.json());

// CSP (Supabase SDK/ESM, 폰트 CDN, OAuth 리디렉션 등 허용)
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh https://dapi.kakao.com https://t1.daumcdn.net http://t1.daumcdn.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; connect-src 'self' http://localhost:3000 https: wss:; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: http:;"
  );
  next();
});

// ---------- 정적 파일 제공 ----------
// /public/** 정적 제공 (브라우저에서 /public/... 경로로 접근)
app.use("/public", express.static(path.join(__dirname, "../public")));

// /source/pages/** 정적 제공
app.use(
  "/source/pages",
  express.static(path.join(__dirname, "../source/pages"))
);
app.use(
  "/source/pages/index",
  express.static(path.join(__dirname, "../source/pages/index"))
);
app.use(
  "/source/pages/map",
  express.static(path.join(__dirname, "../source/pages/map"))
);

// 메인 페이지
app.get("/", (_req, res) => {
  if (!fs.existsSync(indexPath))
    return res.status(404).send("index.html을 찾을 수 없습니다");
  res.sendFile(indexPath);
});

// (옵션) 간단한 /map 라우트
app.get("/map", (_req, res) => {
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

// ---------- API: 길찾기 (Kakao) ----------
app.get("/api/route", async (req, res) => {
  const { startLng, startLat, endLng, endLat } = req.query;
  if (!startLng || !startLat || !endLng || !endLat) {
    return res.status(400).json({ error: "출발지/목적지 좌표 필요" });
  }
  try {
    const resp = await axios.get(
      "https://apis-navi.kakaomobility.com/v1/directions",
      {
        params: {
          origin: `${startLng},${startLat}`,
          destination: `${endLng},${endLat}`,
          priority: "RECOMMEND",
        },
        headers: { Authorization: `KakaoAK ${process.env.KAKAO_KEY}` },
      }
    );
    res.json(resp.data);
  } catch (e) {
    console.error("❌ /api/route:", e);
    res.status(500).json({ error: "경로 검색 오류" });
  }
});

// ---------- API: 코스 CRUD ----------
app.post("/api/course", async (req, res) => {
  const { userId, name, places } = req.body;
  if (!userId || !name || !places) {
    return res.status(400).json({ success: false, error: "데이터 부족" });
  }
  try {
    const { data: course, error: cErr } = await supabase
      .from("courses")
      .insert([{ user_id: userId, name }])
      .select()
      .single();
    if (cErr) throw cErr;

    const rows = (places || []).map((p, i) => ({
      course_id: course.id,
      place_name: p.name,
      lat: p.lat,
      lng: p.lng,
      order_index: i,
      place_id: p.placeId || null,
      media_title: p.mediaTitle || null,
    }));

    const { error: pErr } = await supabase.from("course_places").insert(rows);
    if (pErr) throw pErr;

    res.json({ success: true, courseId: course.id });
  } catch (e) {
    console.error("❌ POST /api/course:", e);
    res.status(500).json({ error: "코스 저장 실패" });
  }
});

app.get("/api/course/:userId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select(
        "id, name, course_places(place_name, lat, lng, order_index, place_id, media_title)"
      )
      .eq("user_id", req.params.userId);
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    console.error("❌ GET /api/course/:userId:", e);
    res.status(500).json({ error: "코스 조회 실패" });
  }
});

app.delete("/api/course/:courseId", async (req, res) => {
  try {
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", req.params.courseId);
    if (error) throw error;
    res.json({ success: true, message: "코스 삭제 완료" });
  } catch (e) {
    console.error("❌ DELETE /api/course/:courseId:", e);
    res.status(500).json({ success: false, error: "코스 삭제 실패" });
  }
});

// ---------- 서버 시작 ----------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
