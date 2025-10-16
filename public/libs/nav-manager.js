import * as auth from "/auth/auth.js";
import { supabase } from "/auth/userStore.js";

document.addEventListener("DOMContentLoaded", () => {
  loadHeader();
});

async function loadHeader() {
  console.log("load header");
  const headerPlaceholder = document.getElementById("headerPlaceholder");
  if (!headerPlaceholder) {
    console.error("body 상단에 headerPlaceholder를 추가해주세요");
    return;
  }

  try {
    const response = await fetch("/includes/_header.html");
    if (!response.ok) {
      throw new Error(`Failed to fetch header: ${response.statusText}`);
    }
    const headerHTML = await response.text();
    headerPlaceholder.innerHTML = headerHTML;

    initializeHeader();
  } catch (error) {
    console.error("Error loading header:", error);
    headerPlaceholder.innerHTML =
      '<p style="text-align:center; color:red;">헤더를 불러오는 중 오류가 발생했습니다.</p>';
  }
}

function initializeHeader() {
  console.log("initialize header");
  const translations = {
    ko: {
      nav: {
        home: "홈",
        content: "콘텐츠별 여행지",
        ai: "AI 코스 추천",
        region: "K-콘텐츠 여행 지도",
        routes: "인기 여행 루트",
        mypage: "마이페이지",
      },
      btn: { login: "로그인", signup: "회원가입" },
    },
    en: {
      nav: {
        home: "Home",
        content: "By Content",
        ai: "AI Course Picks",
        region: "By Region",
        routes: "Popular Routes",
        mypage: "My Page",
      },
      btn: { login: "Login", signup: "Sign Up" },
    },
    ja: {
      nav: {
        home: "ホーム",
        content: "コンテンツ別旅行地",
        ai: "AIコース推薦",
        region: "地域別探索",
        routes: "人気旅行ルート",
        mypage: "マイページ",
      },
      btn: { login: "ログイン", signup: "会員登録" },
    },
  };

  let currentLang = localStorage.getItem("preferredLang") || "ko";

  function updateLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("preferredLang", lang);
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const keys = element.getAttribute("data-i18n").split(".");
      let value = translations[lang];
      try {
        keys.forEach((k) => {
          value = value[k];
        });
        if (value) element.innerHTML = value;
      } catch (e) {}
    });

    window.dispatchEvent(
      new CustomEvent("languagechange", { detail: { lang: currentLang } })
    );
  }

  function updateActiveNav() {
    const currentPath = window.location.pathname;
    document.querySelectorAll(".nav-link").forEach((link) => {
      const linkPath = link.getAttribute("href");
      link.classList.remove("active");
      if (linkPath === currentPath) {
        link.classList.add("active");
      }
      if (currentPath === "/" || currentPath.includes("index.html")) {
        if (link.getAttribute("href") === "/") {
          link.classList.add("active");
        }
      }
    });
  }

  function setupEventListeners() {
    const langSelector = document.getElementById("languageSelector");
    if (langSelector) {
      langSelector.value = currentLang;
      langSelector.addEventListener("change", (e) =>
        updateLanguage(e.target.value)
      );
    }

    document.getElementById("loginBtn")?.addEventListener("click", auth.signInWithGoogle);
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

  function updateLoginUI(isLoggedIn, displayName = "") {
    const greet = document.getElementById("greeting");
    const nick = document.getElementById("nickname");
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (isLoggedIn) {
      nick.textContent = displayName;
      greet.classList.remove("hide");
      logoutBtn.classList.remove("hide");
      loginBtn.classList.add("hide");
    } else {
      nick.textContent = "";
      greet.classList.add("hide");
      logoutBtn.classList.add("hide");
      loginBtn.classList.remove("hide");
    }
  }

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
      }
      updateLoginUI(!!user, displayName);
    }

    const { data } = await supabase.auth.getUser();
    await updateUser(data.user);

    supabase.auth.onAuthStateChange(async (_event, session) => {
      await updateUser(session?.user);
    });
  }

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

  updateLanguage(currentLang);
  updateActiveNav();
  setupEventListeners();
  initializeAuth();
  setupSearchModal();
}
