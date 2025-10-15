const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const supabase = require("../../public/libs/supabase-client");

dotenv.config();

const storage = multer.memoryStorage();
const upload = multer({ storage });

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Get user profile
app.get("/api/profiles/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Profile not found" });
      }
      throw error;
    }

    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ error: "Profile not found" });
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile ->multer 수정
app.post("/api/profiles/:id", upload.single("avatar"), async (req, res) => {
  const { id } = req.params;
  const { display_name, bio } = req.body;

  if (!id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const updates = {
    display_name,
    bio,
  };

  // Handle file upload if a file is provided
  if (req.file) {
    const file = req.file;
    const fileName = `${id}-${Date.now()}`;
    const bucketName = "profile-avatars";

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      if (urlData) {
        updates.avatar_url = urlData.publicUrl;
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return res.status(500).json({ error: "Failed to upload avatar" });
    }
  }

  // Filter out undefined values
  Object.keys(updates).forEach(
    (key) => updates[key] === undefined && delete updates[key]
  );

  // Check if there's anything to update
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No update data provided" });
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({ message: "Profile updated successfully", data });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user reviews with location
app.get("/api/reviews/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Fetch reviews for the user
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (reviewsError) throw reviewsError;

    if (!reviews || reviews.length === 0) {
      return res.json([]);
    }

    // Collect location IDs from reviews
    const locationIds = [...new Set(reviews.map((r) => r.location_id))];

    // Fetch locations -> 불러온 review들에 해당하는 location 데이터들
    const { data: locations, error: locationsError } = await supabase
      .from("location")
      .select("*")
      .in("placeId", locationIds);

    if (locationsError) throw locationsError;

    // Map locations by ID
    const locationsMap = new Map(locations.map((l) => [l.placeId, l]));

    // Combine reviews with location data
    const combinedData = reviews.map((review) => {
      return {
        ...review,
        location: locationsMap.get(review.location_id) || null,
      };
    });

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

  if (!id) {
    return res.status(400).json({ error: "Review ID is required" });
  }

  const updates = {
    rating,
    comment,
    review_image,
    created_at: new Date(),
  };

  // Filter out undefined values
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

    if (error) {
      throw error;
    }

    res.json({ message: "Review updated successfully", data });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a review
app.delete("/api/reviews/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Review ID is required" });
  }

  try {
    const { error } = await supabase.from("reviews").delete().eq("id", id);

    if (error) {
      throw error;
    }

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user courses
app.get("/api/courses/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Fetch courses for the user
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (coursesError) throw coursesError;
    if (!courses || courses.length === 0) {
      return res.json([]);
    }

    // Fetch all places for the retrieved courses
    const courseIds = courses.map((c) => c.id);
    const { data: places, error: placesError } = await supabase
      .from("course_places")
      .select("*")
      .in("course_id", courseIds)
      .order("order_index", { ascending: true });

    if (placesError) throw placesError;

    // Map places to their respective courses
    const placesByCourseId = new Map();
    places.forEach((p) => {
      if (!placesByCourseId.has(p.course_id)) {
        placesByCourseId.set(p.course_id, []);
      }
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
  if (!courseId) {
    return res.status(400).json({ error: "Course ID is required" });
  }

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
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Fetch all favorite entries for the user
    const { data: favorites, error: favError } = await supabase
      .from("user_favorites")
      .select("*")
      .eq("user_id", userId);

    if (favError) throw favError;

    // Separate IDs by type
    const contentIds = favorites
      .filter((f) => f.target_type === "contents")
      .map((f) => f.target_id);
    const locationIds = favorites
      .filter((f) => f.target_type === "location")
      .map((f) => f.target_id);

    // Fetch details for each type
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

app.listen(port, () => {
  console.log(`My page server listening on port ${port}`);
});
