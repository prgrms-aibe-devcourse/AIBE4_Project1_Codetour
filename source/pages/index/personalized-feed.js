import { supabase } from "/auth/userStore.js";

const rail     = document.getElementById("personalizedCourses");
const dots     = document.getElementById("personalizedCoursesDots");
const loginMsg = document.querySelector(".login-message");

function tryTeamRenderer(items) {
  if (window.ContentCards?.render) { window.ContentCards.render(rail, items); return true; }
  if (typeof window.renderContentCards === "function") { window.renderContentCards("personalizedCourses", items); return true; }
  if (window.CardFactory?.render) { window.CardFactory.render(rail, items); return true; }
  if (typeof window.buildCards === "function") { window.buildCards(rail, items); return true; }
  return false;
}

function fallbackRender(items) {
  rail.innerHTML = items.map(it => {
    const hasImg = !!it.imageUrl;
    return `
      <div class="card" style="min-width:320px;">
        ${hasImg ? `
          <div class="card-media">
            <img class="card-image" src="${it.imageUrl}" alt="">
            ${it.badge ? `<span class="card-badge card-badge--overlay">${it.badge}</span>` : ""}
          </div>
        ` : ""}

        <div class="card-content" style="padding:16px;">
          ${!hasImg && it.badge ? `<span class="card-badge" style="margin-bottom:8px;">${it.badge}</span>` : ""}
          <h4 class="card-title" style="margin:4px 0 6px;">${it.title}</h4>
          <p class="card-subtitle" style="color:#6b7280;">${it.subtitle ?? ""}</p>
          <div class="card-meta" style="margin-top:10px;">
            <a class="btn-signup" href="${it.href}" style="padding:.5rem 1rem;">보러가기</a>
          </div>
        </div>
      </div>
    `;
  }).join("");
}


function toCardFromContent(row) {
  const title = row.contents || "콘텐츠";
  const place = row.name || row.location || "";
  const sub   = place ? `${place} 촬영지` : (row.contentGroup || row.category || row.categoty || "");
  return {
    id: `c_${row.contentsId ?? title}`,
    title,
    subtitle: sub,
    imageUrl: row.imageUrl ?? "",          // contents에는 imageUrl 컬럼이 존재
    badge: "추천",
    href: `/source/pages/map/map_page.html?name=${encodeURIComponent(place || title)}`
  };
}

function toCardFromLocation(row) {
  const title = row.placeName || "장소";
  const sub   = row.mediaTitle || row.address || "";
  return {
    id: `l_${row.placeId ?? title}`,
    title,
    subtitle: sub,
    // location 테이블엔 imageUrl 없음 → 안전 처리(없으면 빈값)
    imageUrl: row.image_url ?? row.imageUrl ?? "",
    badge: "추천",
    href: `/source/pages/map/map_page.html?name=${encodeURIComponent(title)}`
  };
}

async function getUserCategories(userId) {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("categories")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  const cats = Array.isArray(data?.categories) ? data.categories : [];
  return [...new Set(cats.map(c => String(c).trim().toLowerCase()))];
}

async function getRecommendationsByCategories(categories) {
  if (!categories.length) return [];

  const norm = c => String(c).trim().toLowerCase().replace(/\s+/g, '-');
  const cats = [...new Set(categories.map(norm))];

  // contents(오타 컬럼: categoty), location(category) 각각 따로 OR 필터
  const orForContents = cats.map(c => `categoty.ilike.%${c}%`).join(',');
  const orForLocation = cats.map(c => `category.ilike.%${c}%`).join(',');

  // 1) contents
  let cont = [];
  {
    const q = supabase
      .from("contents")
      .select("contentsId, contents, name, location, imageUrl, contentGroup, categoty")
      .limit(12);
    if (orForContents) q.or(orForContents);
    const { data, error } = await q;
    if (error) throw error;
    cont = data || [];
  }

  // 2) location  (❗ imageUrl 컬럼 제외)
  let loc = [];
  {
    const q = supabase
      .from("location")
      .select("placeId, placeName, address, mediaTitle, category")
      .limit(12);
    if (orForLocation) q.or(orForLocation);
    const { data, error } = await q;
    if (error) throw error;
    loc = data || [];
  }

  const cards = [
    ...cont.map(toCardFromContent),
    ...loc.map(toCardFromLocation),
  ];

  cards.sort((a, b) => (a.id.startsWith("c_") ? -1 : 1) || a.title.length - b.title.length);
  return cards.slice(0, 5);
}

async function loadPersonalized() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  loginMsg?.classList.add("hide");
  rail?.classList.remove("blur-overlay");

  try {
    const categories = await getUserCategories(user.id);

    if (!categories.length) {
      rail.innerHTML = `<div class="search-empty" style="padding:20px 8px;">
        아직 추천할 콘텐츠가 없어요. <a href="/auth/set-nickname.html">선호 카테고리</a>를 선택해 보세요!
      </div>`;
      return;
    }

    const items = await getRecommendationsByCategories(categories);

    if (!items.length) {
      rail.innerHTML = `<div class="search-empty" style="padding:20px 8px;">
        추천 결과가 없어요. 잠시 후 다시 시도해 주세요.
      </div>`;
      return;
    }

    const ok = tryTeamRenderer(items);
    if (!ok) fallbackRender(items);

    if (dots) {
      dots.innerHTML = items.map((_, i) =>
        `<button class="carousel-dot ${i===0 ? "active" : ""}"></button>`
      ).join("");
    }
  } catch (e) {
    console.error("[personalized] load error:", e);
    rail.innerHTML = `<div class="search-empty" style="padding:20px 8px;">
      추천 데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
    </div>`;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await supabase.auth.getSession();   
  await loadPersonalized();

  supabase.auth.onAuthStateChange(async (ev) => {
    if (["SIGNED_IN", "TOKEN_REFRESHED"].includes(ev)) {
     await supabase.auth.getSession(); 
      await loadPersonalized();
    }
    if (ev === "SIGNED_OUT") {
      rail.innerHTML = "";
      rail.classList.add("blur-overlay");
      loginMsg?.classList.remove("hide");
    }
  });
});

