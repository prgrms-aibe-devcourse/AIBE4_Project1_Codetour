import { supabase } from "./userStore.js";
import * as userManager from "../libs/user-manager.js";

/** URL/경로 유틸 **/
function basePath() {
  return location.pathname.endsWith("/")
    ? location.pathname
    : location.pathname.replace(/[^/]+$/, "");
}
const BASE = `${location.origin}${basePath()}`;
const PATHS = window.AUTH_PATHS ?? {
  INDEX: "index.html",
  SET_NICK: "set-nickname.html",
};

function urlTo(p) {
  if (!p) return BASE;
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith("/")) return `${location.origin}${p}`;
  return `${BASE}${p}`;
}
function currentPage() {
  const last = location.pathname.split("/").pop();
  return last && last.length ? last.toLowerCase() : PATHS.INDEX;
}

async function ensureProfileRow() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .upsert({ id: user.id }, { onConflict: "id" });
  } catch (e) {
    console.warn("[ensureProfileRow] skip:", e?.message || e);
  }
}

/** OAuth 콜백 처리 **/
async function handleOAuthRedirectIfNeeded() {
  const url = new URL(window.location.href);
  const hasCode = url.searchParams.get("code");
  const hasState = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  const errDesc = url.searchParams.get("error_description");

  if (err || errDesc) {
    console.error("OAuth error:", err || errDesc);
    alert("로그인 실패: " + (errDesc || err));
    history.replaceState({}, "", `${BASE}${currentPage()}`);
    return false;
  }
  if (!hasCode || !hasState) return false;

  try {
    const { error } = await supabase.auth.exchangeCodeForSession({
      url: window.location.href,
    });
    if (error) throw error;
    history.replaceState({}, "", `${BASE}${currentPage()}`);
    await ensureProfileRow();
    return true;
  } catch (e) {
    console.error("세션 교환 실패:", e);
    alert(
      "세션 처리 중 오류가 발생했습니다.\nSupabase Redirect URL이 현재 페이지(루트 /)와 일치하는지 확인하세요."
    );
    history.replaceState({}, "", `${BASE}${currentPage()}`);
    return false;
  }
}

async function hardLocalClear() {
  try {
    for (const k of Object.keys(localStorage)) {
      if (/^sb-.*-auth-token/i.test(k)) localStorage.removeItem(k);
    }
    localStorage.removeItem("supabase.auth.token");
    sessionStorage.clear();
  } catch (e) {
    console.warn("local cleanup warn:", e);
  }
}

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/`,
        queryParams: { prompt: "select_account" },
      },
      // 팝업/자동리디렉션 대신 URL만 받고 직접 이동
      skipBrowserRedirect: true,
    });
    if (error) throw error;

    if (data?.url) {
      // 전체 페이지 이동 → 팝업 차단 영향 없음
      window.location.href = data.url;
      return;
    }
    alert("로그인 URL을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.");
  } catch (err) {
    console.error("로그인 오류:", err);
    alert("로그인 중 오류가 발생했습니다.");
  }
}

/**
 * 인증 상태 변경을 알리는 커스텀 이벤트 발생
 *@param{boolean}loggedIn - 로그인 상태
 *@param{object|null}user - 사용자 정보 객체
 */
function dispatchAuthStateChangeEvent(loggedIn, user = null) {
  const event = new CustomEvent("auth-state-changed", {
    detail: { loggedIn, user },
  });
  window.dispatchEvent(event);
}

/** 로그아웃 **/
let routing = false;
export async function signOut() {
  console.log("logout click");
  if (routing) return;
  routing = true;

  const target = `${urlTo(PATHS.INDEX)}?signed_out=${Date.now()}`;
  const { data: sub } = supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") window.location.replace(target);
  });

  try {
    await supabase.auth.signOut({ scope: "global" }).catch(() => {});
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
  } finally {
    await hardLocalClear();

    //'auth-state-changed' 이벤트 발생
    dispatchAuthStateChangeEvent(false);

    setTimeout(() => {
      try {
        sub?.subscription?.unsubscribe?.();
      } catch {}
      window.location.replace(target);
      routing = false;
    }, 300);
  }
}

/** 로그인 상태별 이벤트 발생 -> nav-manager에서 헤더 토글 & 닉네임 표시 **/
async function renderIndexUI() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) {
      //로그아웃 상태 이벤트 발생
      dispatchAuthStateChangeEvent(false);
      return;
    }

    let display = user.email?.split("@")[0] ?? "사용자";
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (!error && data?.display_name) display = data.display_name;
    } catch (e) {
      console.warn("[renderIndexUI] profile fetch warn:", e?.message || e);
    }

    //로그인 이벤트 발생
    const userData = {
      id: user.id,
      email: user.email,
      nickname: display,
      profile_image_url: user.user_metadata?.avatar_url ?? "",
    };
    dispatchAuthStateChangeEvent(true, userData);
    console.log("[auth.js] 'auth-state-changed' (login) 이벤트 발생 완료");
  } catch (err) {
    console.error("auth getUser 실패:", err.message);
  }
}

async function routeByProfile() {
  if (routing) return;
  routing = true;

  const page = currentPage();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    if (page !== PATHS.INDEX) location.replace(urlTo(PATHS.INDEX));
    routing = false;
    return;
  }

  let hasNick = false;
  try {
    const { data: prof } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    hasNick = !!prof?.display_name;
  } catch {}

  const dest = hasNick ? PATHS.INDEX : PATHS.SET_NICK;
  if (hasNick && page === "set-nickname.html") {
    // returnUrl이 있으면 그곳으로, 없으면 홈으로
    const returnUrl = sessionStorage.getItem("returnUrl");
    if (returnUrl) {
      sessionStorage.removeItem("returnUrl");
      location.replace(returnUrl);
    } else {
      location.replace(urlTo(PATHS.INDEX));
    }
    return;
  }
  if (page !== dest.toLowerCase()) {
    location.replace(urlTo(dest));
    return;
  }
  routing = false;
}

if (document.querySelector(".auth-page")) {
  window.addEventListener("DOMContentLoaded", async () => {
    userManager.initAuthListener();
    const page = currentPage();

    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const loginLarge = document.querySelector(".btn-login-large");

    if (loginBtn) loginBtn.onclick = signInWithGoogle;
    if (loginLarge) loginLarge.onclick = signInWithGoogle;
    if (logoutBtn) logoutBtn.onclick = signOut;

    await handleOAuthRedirectIfNeeded();

    if (page === PATHS.INDEX) {
      await renderIndexUI();
      await routeByProfile();

      supabase.auth.onAuthStateChange(async (event) => {
        if (["SIGNED_IN", "TOKEN_REFRESHED", "SIGNED_OUT"].includes(event)) {
          await renderIndexUI();
          if (event !== "SIGNED_OUT") await ensureProfileRow();
          if (event !== "SIGNED_OUT") await routeByProfile();
        }
      });
    }

    if (page === PATHS.SET_NICK) {
      const { data: session } = await supabase.auth.getSession();
      if (session?.session) await routeByProfile();

      supabase.auth.onAuthStateChange(async (event) => {
        if (["SIGNED_IN", "TOKEN_REFRESHED"].includes(event)) {
          await ensureProfileRow();
          await routeByProfile();
        }
        if (event === "SIGNED_OUT") {
          window.location.replace(urlTo(PATHS.INDEX));
        }
      });
    }
  });
}
