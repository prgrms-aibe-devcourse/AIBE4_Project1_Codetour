const express = require("express");
const axios = require("axios");
const router = express.Router();

// Supabase 클라이언트는 메인 서버에서 주입받음
let supabase;

// Supabase 클라이언트 설정 함수
function setSupabase(supabaseClient) {
  supabase = supabaseClient;
}

// 좌표 파싱 함수
function parseCoordinates(coordStr) {
  // "N37.545904, E126.92094" → { lat: 37.545904, lng: 126.92094 }
  if (!coordStr) return null;
  const parts = coordStr.split(",").map((s) => s.trim());
  const lat = parseFloat(parts[0].replace("N", "").replace("S", "-"));
  const lng = parseFloat(parts[1].replace("E", "").replace("W", "-"));
  return { lat, lng };
}

// 장소 검색 (location 테이블)
router.get("/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "검색어가 필요합니다." });

  try {
    // placeName, mediaTitle, address 등에서 검색
    const { data: locations, error } = await supabase
      .from("location")
      .select("*")
      .or(
        `placeName.ilike.%${query}%,mediaTitle.ilike.%${query}%,address.ilike.%${query}%,keyword.ilike.%${query}%`
      )
      .limit(20);

    if (error) throw error;

    // Kakao API 형식으로 변환
    const documents = locations.map((loc) => {
      const coords = parseCoordinates(loc.coordinates);
      return {
        place_name: loc.placeName,
        address_name: loc.address || "",
        x: coords ? coords.lng : 126.978,
        y: coords ? coords.lat : 37.5665,
        // 추가 정보
        place_id: loc.placeId,
        media_title: loc.mediaTitle,
        description: loc.description,
        image_url: loc.imageUrl,
        format: loc.format,
        rating: loc.rating,
      };
    });

    res.json({ documents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "검색 중 오류 발생" });
  }
});

// 콘텐츠로 장소 검색 (contents 테이블의 contents 컬럼으로 선택 → name 컬럼의 location으로 매칭)
router.get("/search-by-content", async (req, res) => {
  const contentName = req.query.name;
  if (!contentName)
    return res.status(400).json({ error: "콘텐츠 이름이 필요합니다." });

  try {
    // 1. contents 테이블에서 해당 contents의 모든 name(location) 정보 가져오기
    const { data: contentData, error: contentError } = await supabase
      .from("contents")
      .select("name")
      .eq("contents", contentName);

    if (contentError) throw contentError;

    if (!contentData || contentData.length === 0) {
      return res.json({ documents: [] });
    }

    // 2. name 컬럼의 값들을 추출 (중복 제거)
    const locationNames = [
      ...new Set(contentData.map((c) => c.name).filter(Boolean)),
    ];

    console.log(`🔍 "${contentName}"의 촬영지:`, locationNames);

    // 3. location 테이블에서 해당 placeName들과 일치하는 모든 항목 찾기
    const { data: locations, error: locError } = await supabase
      .from("location")
      .select("*")
      .in("placeName", locationNames);

    if (locError) throw locError;

    console.log("📍 찾은 location 데이터:", locations?.length);

    // 중복 제거 (placeName 기준)
    const uniqueLocations = [
      ...new Map(locations.map((item) => [item.placeName, item])).values(),
    ];

    const documents = uniqueLocations.map((loc) => {
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

    console.log(`✅ "${contentName}" 검색 결과: ${documents.length}개 장소`);
    res.json({ documents });
  } catch (err) {
    console.error("❌ 콘텐츠 검색 실패:", err);
    res.status(500).json({ error: "검색 중 오류 발생" });
  }
});

// 콘텐츠 목록 조회
router.get("/contents", async (req, res) => {
  try {
    const { data: contents, error } = await supabase
      .from("contents")
      .select("contentsId, contents, name, location, explanation,contentGroup")
      .limit(50);

    console.log("📺 콘텐츠 조회 시도");
    console.log("Error:", error);
    console.log("Data:", contents);
    console.log("Data type:", Array.isArray(contents) ? "배열" : "배열 아님");
    console.log("Data count:", contents?.length);

    if (error) throw error;

    // 배열이 아니면 빈 배열 반환
    if (!Array.isArray(contents)) {
      return res.json([]);
    }

    res.json(contents);
  } catch (err) {
    console.error("❌ 콘텐츠 조회 실패:", err);
    res.status(500).json({ error: "콘텐츠 조회 실패" });
  }
});

// 경로 검색 (기존 Kakao API 사용)
router.get("/route", async (req, res) => {
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
router.post("/course", async (req, res) => {
  const { userId, name, places } = req.body;
  if (!userId || !name || !places)
    return res.status(400).json({ success: false, error: "데이터 부족" });

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
      place_id: p.placeId || null, // location 테이블의 placeId 연결
      media_title: p.mediaTitle || null,
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

// 코스 조회
router.get("/course/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: courses, error } = await supabase
      .from("courses")
      .select(
        "id, name, course_places(place_name, lat, lng, order_index, place_id, media_title)"
      )
      .eq("user_id", userId);

    if (error) throw error;
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "코스 조회 실패" });
  }
});

// 코스 삭제
router.delete("/course/:courseId", async (req, res) => {
  const { courseId } = req.params;
  if (!courseId)
    return res.status(400).json({ success: false, error: "코스 ID 필요" });

  try {
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);

    if (error) throw error;

    console.log(`🗑️ 코스 ${courseId} 삭제됨`);
    res.json({ success: true, message: "코스 삭제 완료" });
  } catch (err) {
    console.error("❌ 코스 삭제 실패:", err);
    res.status(500).json({ success: false, error: "코스 삭제 실패" });
  }
});

// 사용자 카테고리 선호도 저장
router.post("/preferences", async (req, res) => {
  const { userId, preferences } = req.body;
  if (!userId || !preferences || !Array.isArray(preferences)) {
    return res
      .status(400)
      .json({ error: "userId와 preferences 배열이 필요합니다" });
  }

  try {
    // preferences: [{ category: "k-pop", preference: 1 }, { category: "drama", preference: 0 }, ...]
    const preferencesData = preferences.map((pref) => ({
      user_id: userId,
      category: pref.category,
      preference: pref.preference,
    }));

    // upsert: 이미 존재하면 업데이트, 없으면 삽입
    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(preferencesData, { onConflict: "user_id,category" })
      .select();

    if (error) throw error;

    console.log(`✅ 사용자 ${userId}의 선호도 ${data.length}개 저장됨`);
    res.json({ success: true, count: data.length });
  } catch (err) {
    console.error("❌ 선호도 저장 실패:", err);
    res.status(500).json({ error: "선호도 저장 실패" });
  }
});

// 사용자 카테고리 선호도 조회
router.get("/preferences/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data: preferences, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    console.log(`📊 사용자 ${userId}의 선호도 조회: ${preferences.length}개`);
    res.json(preferences);
  } catch (err) {
    console.error("❌ 선호도 조회 실패:", err);
    res.status(500).json({ error: "선호도 조회 실패" });
  }
});

// 프로필 목록 조회
router.get("/profiles", async (req, res) => {
  try {
    console.log("🔍 프로필 조회 시도...");
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .order("created_at", { ascending: true });

    console.log("프로필 조회 결과:");
    console.log("  - Error:", error);
    console.log("  - Data:", profiles);
    console.log("  - Data type:", Array.isArray(profiles) ? "배열" : typeof profiles);
    console.log("  - Count:", profiles?.length);

    if (error) {
      console.error("❌ Supabase 에러:", error);
      throw error;
    }

    console.log(`👥 프로필 조회: ${profiles?.length || 0}개`);
    res.json(profiles || []);
  } catch (err) {
    console.error("❌ 프로필 조회 실패:", err);
    res.status(500).json({ error: "프로필 조회 실패", details: err.message });
  }
});

module.exports = { router, setSupabase };
