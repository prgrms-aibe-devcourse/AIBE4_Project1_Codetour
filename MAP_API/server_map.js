require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase 연결
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.use(cors()); // CORS 허용
app.use(express.json());
app.use(express.static("public"));

// 장소 검색
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "검색어가 필요합니다." });

  try {
    const response = await axios.get(
      "https://dapi.kakao.com/v2/local/search/keyword.json",
      {
        params: { query },
        headers: { Authorization: `KakaoAK ${process.env.KAKAO_KEY}` },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "검색 중 오류 발생" });
  }
});

// 경로 검색
app.get("/api/route", async (req, res) => {
  const { startLng, startLat, endLng, endLat } = req.query;
  if (!startLng || !startLat || !endLng || !endLat) {
    return res.status(400).json({ error: "출발지/목적지 좌표 필요" });
  }

  try {
    const response = await axios.get(
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
    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "경로 검색 오류" });
  }
});

// 코스 저장
app.post("/api/course", async (req, res) => {
  const { userId, name, places } = req.body;
  if (!userId || !name ||!places) return res.status(400).json({ success:false, error: "데이터 부족" });

  try {
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert([{ user_id: userId, name }])
      .select()
      .single();

    if (courseError) throw courseError;

    const placesData = places.map((p, idx) => ({
      course_id: course.id,
      place_name: p.name,
      lat: p.lat,
      lng: p.lng,
      order_index: idx,
    }));

    const { error: placesError } = await supabase
      .from("course_places")
      .insert(placesData);

    if (placesError) throw placesError;

    res.json({ success: true, courseId: course.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "코스 저장 실패" });
  }
});

app.get("/api/course/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: courses, error } = await supabase
      .from("courses")
      .select("id, name, course_places(place_name, lat, lng, order_index)")
      .eq("user_id", userId);

    if (error) throw error;
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "코스 조회 실패" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
