// server/server_map.js
require("dotenv").config({ path: __dirname + "/../.env" });
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");
const { router: mapRouter, setSupabase } = require("./routes/map");
const multer = require("multer");

// Configure multer for memory storage to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

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
      // API / Realtime / 개발 서버(로컬) + 구글 OAuth 허용
      "connect-src 'self' http://localhost:3000 https: wss: https://accounts.google.com https://www.googleapis.com https://*.googleusercontent.com",
      // 이미지/동영상 등
      "img-src 'self' https: http: data: blob:",
      // OAuth 프레임 허용
      "frame-src https: https://accounts.google.com https://*.googleusercontent.com",
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
  "/source/pages/aiCourse",
  express.static(path.join(__dirname, "../source/pages/aiCourse"))
);
app.use(
  "/source/pages/contents",
  express.static(path.join(__dirname, "../source/pages/contents"))
);
app.use("/auth", express.static(path.join(__dirname, "../public/auth")));
app.use(
  "/source/pages/my-page",
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

// ---------- My Page API ----------
// Get user profile
app.get("/api/profiles/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "User ID is required" });

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116")
        return res.status(404).json({ error: "Profile not found" });
      throw error;
    }
    res.json(data || { error: "Profile not found" });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile
app.post("/api/profiles/:id", upload.single("avatar"), async (req, res) => {
  const { id } = req.params;
  const { display_name, bio } = req.body; // Text fields from multer

  if (!id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const updates = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (bio !== undefined) updates.bio = bio;

    // Handle file upload to Supabase Storage
    if (req.file) {
      const file = req.file;
      const fileExt = path.extname(file.originalname);
      const fileName = `avatar_${id}${fileExt}`;
      const filePath = `${id}/${fileName}`; // Store in a user-specific folder

      // Upload file to bucket
      const { error: uploadError } = await supabase.storage
        .from("profile-avatars")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true, // Overwrite existing file
        });

      if (uploadError) {
        // Throw error to be caught by the catch block
        throw new Error(`Storage Error: ${uploadError.message}`);
      }

      // Get the public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from("profile-avatars")
        .getPublicUrl(filePath);

      updates.avatar_url = `${urlData.publicUrl}?t=${new Date().getTime()}`;
    }

    const { data, error: dbError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (dbError) {
      // If there's a database error, throw it
      throw dbError;
    }

    res.json({ message: "Profile updated successfully", data });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

// Get user reviews with location
app.get("/api/reviews/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  try {
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (reviewsError) throw reviewsError;
    if (!reviews || reviews.length === 0) return res.json([]);

    const locationIds = [...new Set(reviews.map((r) => r.location_id))];
    const { data: locations, error: locationsError } = await supabase
      .from("location")
      .select("*")
      .in("placeId", locationIds);

    if (locationsError) throw locationsError;

    const locationsMap = new Map(locations.map((l) => [l.placeId, l]));
    const combinedData = reviews.map((review) => ({
      ...review,
      location: locationsMap.get(review.location_id) || null,
    }));

    res.json(combinedData);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a review
app.put("/api/reviews/:id", async (req, res) => {
  const { id } = req.params;
  const { rating, comment, review_image } = req.body;
  if (!id) return res.status(400).json({ error: "Review ID is required" });

  const updates = { rating, comment, review_image, created_at: new Date() };
  Object.keys(updates).forEach(
    (key) => updates[key] === undefined && delete updates[key]
  );

  try {
    const { data, error } = await supabase
      .from("reviews")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: "Review updated successfully", data });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a review
app.delete("/api/reviews/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Review ID is required" });

  try {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) throw error;
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user courses
app.get("/api/courses/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  try {
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (coursesError) throw coursesError;
    if (!courses || courses.length === 0) return res.json([]);

    const courseIds = courses.map((c) => c.id);
    const { data: places, error: placesError } = await supabase
      .from("course_places")
      .select("*")
      .in("course_id", courseIds)
      .order("order_index", { ascending: true });

    if (placesError) throw placesError;

    const placesByCourseId = new Map();
    places.forEach((p) => {
      if (!placesByCourseId.has(p.course_id))
        placesByCourseId.set(p.course_id, []);
      placesByCourseId.get(p.course_id).push(p);
    });

    const combinedData = courses.map((course) => ({
      ...course,
      places: placesByCourseId.get(course.id) || [],
    }));

    res.json(combinedData);
  } catch (error) {
    console.error("Error fetching user courses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a course
app.delete("/api/courses/:courseId", async (req, res) => {
  const { courseId } = req.params;
  if (!courseId)
    return res.status(400).json({ error: "Course ID is required" });

  try {
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);
    if (error) throw error;
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user favorites
app.get("/api/favorites/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  try {
    const { data: favorites, error: favError } = await supabase
      .from("user_favorites")
      .select("*")
      .eq("user_id", userId);

    if (favError) throw favError;

    const contentIds = favorites
      .filter((f) => f.target_type === "contents")
      .map((f) => f.target_id);
    const locationIds = favorites
      .filter((f) => f.target_type === "location")
      .map((f) => f.target_id);

    const [contentsRes, locationsRes] = await Promise.all([
      contentIds.length > 0
        ? supabase.from("contents").select("*").in("contentsId", contentIds)
        : Promise.resolve({ data: [], error: null }),
      locationIds.length > 0
        ? supabase.from("location").select("*").in("placeId", locationIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (contentsRes.error) throw contentsRes.error;
    if (locationsRes.error) throw locationsRes.error;

    res.json({
      contents: contentsRes.data,
      location: locationsRes.data,
    });
  } catch (error) {
    console.error("Error fetching user favorites:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user preferences
app.get("/api/preferences/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  try {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("categories")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
    res.json(data || { categories: [] });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user preferences
app.post("/api/preferences", async (req, res) => {
  console.log("Received preferences update request:", req.body);
  const { userId, categories } = req.body;
  if (!userId || !categories) {
    return res
      .status(400)
      .json({ error: "User ID and categories are required" });
  }

  try {
    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: userId, categories: categories, updated_at: new Date() },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) throw error;
    res.json({ message: "Preferences updated successfully", data });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
