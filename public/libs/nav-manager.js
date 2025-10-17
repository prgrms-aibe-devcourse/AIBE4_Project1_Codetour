import * as auth from "/auth/auth.js";
import { supabase } from "/auth/userStore.js";
import * as userManager from "./user-manager.js";

const headerPath = "/includes/_header.html";

let translations = {};

let lang = localStorage.getItem("preferredLang");
if (!lang) {
  lang = localStorage.setItem("preferredLang", "ko");
}
/*
nav-manager.js
:실행될 때 현재 페이지에 (public/includes/_header.html)을 fetch후 관련 기능(인증,번역, 검색, 로그인, 네비게이션)들 초기화
*/

/*
각 네비게이션마다 실행
홈: "/source/pages/index/index.html"
콘텐츠별 여행지: "/source/pages/contents/contents.html"
AI 코스 추천: "/source/pages/aiCourse/aiSchedule.html"
K-콘텐츠 여행 지도: "/source/pages/map/map_page.html"
인기 여행 루트: "/source/pages/index/index.html#routes"
마이페이지: "/source/pages/my-page/my-page.html"
*/
document.addEventListener("DOMContentLoaded", async () => {
  userManager.initAuthListener();
  await loadHeader();
  lang = localStorage.getItem("preferredLang") || "ko";
  await loadTranslations(lang);
  initializeSPA();
  initionlizeTranslateUI();
  applyTranslations();
});

//_header.html fetch
async function loadHeader() {
  console.log("load header");
  const headerPlaceholder = document.getElementById("headerPlaceholder");
  if (!headerPlaceholder) {
    console.error("body 상단에 headerPlaceholder를 추가해주세요");
    return;
  }

  const response = await fetch(headerPath);
  if (!response.ok) {
    throw new Error(`Failed to fetch header: ${response.statusText}`);
  }
  const headerHTML = await response.text();
  headerPlaceholder.innerHTML = headerHTML;

  await initializeHeader();
}

//번역, 검색, 로그인, 네비게이션 관련 기능들 초기화
async function initializeHeader() {
  updateActiveNav();
  setupEventListeners();
  initializeAuth();
  setupSearchModal();
}

//spa(페이지 새로고침 없이 이동)
function initializeSPA() {
  document.body.addEventListener("click", async (e) => {
    const link = e.target.closest("a[data-spa]");
    if (!link) return;
    e.preventDefault();

    const href = link.getAttribute("href");
    await loadPage(href);
    history.pushState({ path: href }, "", href);
  });

  window.addEventListener("popstate", (e) => {
    const path = e.state?.path || location.pathname;
    loadPage(path);
  });
}

async function loadPage(path) {
  const main = document.querySelector("main");
  if (!main) return;

  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error("페이지 로드 실패");
    main.innerHTML = await res.text();
    updateActiveNav();
    window.dispatchEvent(new Event("pagechange"));
  } catch (err) {
    main.innerHTML = `<div class="error">${i18next.t(
      "error.pageLoadFailed"
    )}</div>`;
  }
}

//번역
async function loadTranslations(lang) {
  const namespaces = [
    "header",
    "index",
    "contents",
    "map-page",
    "aiSchedule",
    "my-page",
  ];
  const loaded = await Promise.all(
    namespaces.map((ns) =>
      fetch(`/locales/${lang}/${ns}.json`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : {}))
        .catch(() => ({}))
    )
  );

  // 네임스페이스별로 병합
  translations = namespaces.reduce((acc, ns, i) => {
    acc[ns] = loaded[i];
    return acc;
  }, {});
}
function getTranslation(key) {
  const parts = key.split(".");

  for (const ns in translations) {
    let value = translations[ns];
    let found = true;
    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = value[part];
      } else {
        found = false;
        break;
      }
    }
    if (found) {
      return value;
    }
  }

  return null;
}

function initionlizeTranslateUI() {
  const languageSelector = document.querySelector(".languageSelector");
  if (!languageSelector) return;
  lang = localStorage.getItem("preferredLang");
  const currentOption = languageSelector.querySelector("option[value=lang]");
  if (!currentOption) return;
  currentOption.selected = true;
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const text = getTranslation(key);

    if (text) {
      // input / textarea는 placeholder 처리
      if (["INPUT", "TEXTAREA"].includes(el.tagName)) {
        el.placeholder = text;
      } else {
        el.innerHTML = text;
      }
    }
  });
}
async function changeLanguage(langParam) {
  console.log(`change language ${lang} -> ${langParam}`);
  if (langParam === lang) return;

  lang = langParam;
  localStorage.setItem("preferredLang", langParam);

  await loadTranslations(langParam);
  applyTranslations();

  const event = new CustomEvent("languageChanged", {
    detail: langParam,
  });
  window.dispatchEvent(event);
}

window.changeLanguage = changeLanguage;

//initialize 함수들

//네비게이션 활성화
function updateActiveNav() {
  const currentPath = window.location.pathname;
  //루트경로 처리
  let currentPathNormalize =
    currentPath === "/" || currentPath.endsWith("/index.html")
      ? "/"
      : currentPath;

  const currentPathBase =
    currentPathNormalize.split("/").slice(0, -1).join("/") || "/";

  document.querySelectorAll(".nav-link").forEach((link) => {
    const linkPath = link.getAttribute("href");
    if (linkPath) {
      const linkPathNormalize =
        linkPath === "/" || linkPath.endsWith("/index.html") ? "/" : linkPath;
      const linkPathBase =
        linkPathNormalize.split("/").slice(0, -1).join("/") || "/";

      link.classList.remove("active");
      if (currentPathBase === linkPathBase && linkPathBase !== "") {
        link.classList.add("active");
      } else if (currentPath === linkPath) {
        link.classList.add("active");
      }
    }
  });
}

//이벤트 리스너
function setupEventListeners() {
  document
    .getElementById("loginBtn")
    ?.addEventListener("click", auth.signInWithGoogle);
  document.getElementById("logoutBtn")?.addEventListener("click", auth.signOut);

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      const target = link.getAttribute("href");
      if (target.startsWith("#")) {
        e.preventDefault();
        document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

//로그인, 로그아웃 UI
function updateLoginUI(isLoggedIn, displayName = "") {
  const greet = document.getElementById("greeting");
  const nick = document.getElementById("nickname");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  console.log("[updateLoginUI] 요소 확인:", {
    greet: !!greet,
    nick: !!nick,
    loginBtn: !!loginBtn,
    logoutBtn: !!logoutBtn,
    isLoggedIn,
    displayName,
  });

  if (!loginBtn) {
    console.warn("[updateLoginUI] loginBtn이 없습니다");
    return;
  }

  if (isLoggedIn) {
    if (nick) nick.textContent = displayName;
    if (greet) greet.classList.remove("hide");
    if (logoutBtn) logoutBtn.classList.remove("hide");
    loginBtn.classList.add("hide");
  } else {
    if (nick) nick.textContent = "";
    if (greet) greet.classList.add("hide");
    if (logoutBtn) logoutBtn.classList.add("hide");
    loginBtn.classList.remove("hide");
  }

  console.log("[updateLoginUI] 완료");
}

//로그인 UI 초기화
async function initializeAuth() {
  async function updateUser(user) {
    let displayName = "";
    if (user) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();
        displayName =
          profile?.display_name || user.email?.split("@")[0] || "사용자";
      } catch (e) {
        displayName = user.email?.split("@")[0] || "사용자";
      }
      updateLoginUI(true, displayName);

      const supabaseUser = window.currentUser;
      const userDataForUserManager = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        nickname: supabaseUser.name,
        profile_image_url: supabaseUser.avatar_url,
      };
      userManager.setLoggedInUser(userDataForUserManager);
    } else {
      updateLoginUI(false);
      userManager.clearUser();
    }
  }

  const { data } = await supabase.auth.getUser();
  await updateUser(data.user);

  supabase.auth.onAuthStateChange(async (_event, session) => {
    await updateUser(session?.user);
  });
}

//검색 기능
function setupSearchModal() {
  const header = document.querySelector(".header");
  const wrap = document.getElementById("headerSearchWrap");
  const input = document.getElementById("searchInput");
  const btnToggle = document.getElementById("searchToggle");
  const btnClose = document.getElementById("searchClose");
  const btnDo = document.getElementById("searchDo");
  const results = document.getElementById("searchResults");

  const suggestTitle = document.getElementById("contentSuggestTitle");
  const suggestRail = document.getElementById("contentSuggestRail");

  let allContents = null;

  function tryTeamRenderer(items) {
    if (window.ContentCards?.render) {
      window.ContentCards.render(suggestRail, items);
      return true;
    }
    if (typeof window.renderContentCards === "function") {
      window.renderContentCards("contentSuggestRail", items);
      return true;
    }
    if (window.CardFactory?.render) {
      window.CardFactory.render(suggestRail, items);
      return true;
    }
    if (typeof window.buildCards === "function") {
      window.buildCards(suggestRail, items);
      return true;
    }
    return false;
  }
  function fallbackRender(items) {
    suggestRail.innerHTML = items
      .map(
        (it) => `
          <div class="search-item" style="min-width:220px;">
            <div style="font-weight:700;">${it.title}</div>
            <div style="color:#666;font-size:13px;margin-top:2px;">${
              it.subtitle ?? ""
            }</div>
          </div>
        `
      )
      .join("");
  }

  function renderRail(items) {
    suggestTitle.style.display = items?.length ? "" : "none";
    suggestRail.innerHTML = "";
    if (!items?.length) return;
    const ok = tryTeamRenderer(items);
    if (!ok) fallbackRender(items);
    if (wrap.style.height && wrap.style.height !== "0px") {
      wrap.style.height = "auto";
      const h = wrap.scrollHeight;
      wrap.style.height = h + "px";
    }
  }

  function clearRail() {
    suggestTitle.style.display = "none";
    suggestRail.innerHTML = "";
  }

  function setWrapHeight(open) {
    if (open) {
      wrap.style.height = wrap.scrollHeight + "px";
      header.classList.add("header--search-open");
    } else {
      wrap.style.height = "0px";
      header.classList.remove("header--search-open");
    }
  }
  function openSearch() {
    results.innerHTML = "";
    clearRail();
    input.value = "";
    setWrapHeight(true);
    setTimeout(() => input.focus(), 0);
    ensureContentsLoaded();
  }
  function closeSearch() {
    setWrapHeight(false);
  }
  function toggleSearch() {
    const isOpen = wrap.style.height && wrap.style.height !== "0px";
    isOpen ? closeSearch() : openSearch();
  }
  btnToggle?.addEventListener("click", toggleSearch);
  btnClose?.addEventListener("click", closeSearch);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearch();
  });
  window.addEventListener("resize", () => {
    if (wrap.style.height && wrap.style.height !== "0px") {
      wrap.style.height = "auto";
      const h = wrap.scrollHeight;
      wrap.style.height = h + "px";
    }
  });

  async function ensureContentsLoaded() {
    if (allContents) return;
    try {
      const res = await fetch("/api/contents");
      if (!res.ok) throw new Error("contents load failed");
      const data = await res.json(); // [{ contents, name, ... }]
      const unique = [
        ...new Set(
          (data || []).map((d) => (d.contents || "").trim()).filter(Boolean)
        ),
      ];
      const countByContent = unique.map((c) => ({
        content: c,
        count: (data || []).filter((d) => (d.contents || "").trim() === c)
          .length,
      }));
      allContents = countByContent;
    } catch (e) {
      console.error("Failed to load contents:", e);
      allContents = [];
    }
  }
  function rankScore(q, name) {
    const a = (q || "").toLowerCase();
    const b = (name || "").toLowerCase();
    if (!a || !b) return 0;
    if (b === a) return 100;
    if (b.startsWith(a)) return 80;
    if (b.includes(a)) return 60;
    let lcs = 0;
    for (let i = 0; i < a.length; i++) {
      for (let j = i + 1; j <= a.length; j++) {
        if (b.includes(a.slice(i, j))) lcs = Math.max(lcs, j - i);
      }
    }
    return lcs;
  }
  function buildCardItems(q, boostSet = new Set()) {
    if (!allContents || allContents.length === 0) return [];
    return allContents
      .map(({ content, count }) => {
        const score =
          rankScore(q, content) +
          Math.min(count, 10) * 2 +
          (boostSet.has(content) ? 15 : 0);
        return { content, count, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => ({
        id: s.content,
        title: s.content,
        subtitle: `관련 장소 약 ${s.count}개`,
        imageUrl: null,
        href: `/source/pages/map/map_page.html?name=${encodeURIComponent(
          s.content
        )}`,
      }));
  }

  const debounce = (fn, ms = 300) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };

  function renderResults(docs, q) {
    if (!docs?.length) {
      results.innerHTML = `<p class="search-empty">"${q}" 검색 결과가 없어요.</p>`;
    } else {
      results.innerHTML = docs
        .slice(0, 20)
        .map(
          (d) => `
            <div class="search-item" data-name="${
              d.place_name ?? ""
            }" data-lat="${d.y ?? ""}" data-lng="${d.x ?? ""}">
              <div style="font-weight:700;">${
                d.place_name ?? d.media_title ?? ""
              }</div>
              <div style="color:#666;font-size:13px;margin-top:2px;">${
                d.address_name ?? d.media_title ?? ""
              }</div>
            </div>
          `
        )
        .join("");

      Array.from(results.querySelectorAll(".search-item")).forEach((el) => {
        el.addEventListener("click", () => {
          const name = el.getAttribute("data-name") || "";
          const lat = el.getAttribute("data-lat") || "";
          const lng = el.getAttribute("data-lng") || "";
          const url = `/source/pages/map/map_page.html?name=${encodeURIComponent(
            name
          )}&lat=${lat}&lng=${lng}`;
          window.location.href = url;
        });
      });
    }
    if (wrap.style.height && wrap.style.height !== "0px") {
      wrap.style.height = "auto";
      const h = wrap.scrollHeight;
      wrap.style.height = h + "px";
    }
  }

  async function doSearch(q) {
    if (!q || !q.trim()) {
      results.innerHTML = "";
      renderRail([]);
      return;
    }
    try {
      const [byText, byContent] = await Promise.all([
        fetch(`/api/search?q=${encodeURIComponent(q)}`)
          .then((r) => (r.ok ? r.json() : { documents: [] }))
          .catch(() => ({ documents: [] })),
        fetch(`/api/search-by-content?name=${encodeURIComponent(q)}`)
          .then((r) => (r.ok ? r.json() : { documents: [] }))
          .catch(() => ({ documents: [] })),
      ]);

      const docs = [
        ...(byText?.documents ?? []),
        ...(byContent?.documents ?? []),
      ];
      renderResults(docs, q);

      const boostSet = new Set(
        (docs || []).map((d) => (d.media_title || "").trim()).filter(Boolean)
      );
      const items = buildCardItems(q, boostSet);
      renderRail(items);
    } catch (e) {
      console.error(e);
      results.innerHTML = `<p class="search-empty">검색 중 오류가 발생했어요.</p>`;
      renderRail([]);
    }
  }

  input?.addEventListener(
    "input",
    debounce((e) => doSearch(e.target.value), 300)
  );
  btnDo?.addEventListener("click", () => doSearch(input.value));
}
