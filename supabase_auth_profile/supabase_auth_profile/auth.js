// auth.js (single-page OAuth callback + hard logout)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** URL/경로 유틸**/
function basePath() {
  // / -> /   |  /repo/index.html -> /repo/
  return location.pathname.endsWith("/")
    ? location.pathname
    : location.pathname.replace(/[^/]+$/, "");
}
const BASE = `${location.origin}${basePath()}`;
const PATHS = {
  INDEX: "index.html",
  SET_NICK: "set-nickname.html",
};

function urlTo(p) {
  return `${BASE}${p}`;
}
function currentPage() {
  const last = location.pathname.split("/").pop();
  return (last && last.length) ? last.toLowerCase() : PATHS.INDEX;
}

/** OAuth 콜백 **/
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
    const { error } = await supabase.auth.exchangeCodeForSession({ url: window.location.href });
    if (error) throw error;

    history.replaceState({}, "", `${BASE}${currentPage()}`);
    return true;
  } catch (e) {
    console.error("세션 교환 실패:", e);
    alert(
      "세션 처리 중 오류가 발생했습니다.\n" +
      "Supabase/Google Redirect URL이 현재 페이지(루트 /)와 일치하는지 확인하세요."
    );
    history.replaceState({}, "", `${BASE}${currentPage()}`);
    return false;
  }
}

/** 로그인/로그아웃 유틸 **/
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

async function signInWithGoogle() {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: BASE,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) throw error;
  } catch (err) {
    console.error("로그인 오류:", err);
    alert("로그인 중 오류가 발생했습니다.");
  }
}

let routing = false;
async function signOut() {
  if (routing) return;
  routing = true;

  const target = `${urlTo(PATHS.INDEX)}?signed_out=${Date.now()}`;

  // SIGNED_OUT 이벤트 대기
  let redirected = false;
  const { data: sub } = supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT" && !redirected) {
      redirected = true;
      window.location.replace(target);
    }
  });

  try {
    await supabase.auth.signOut({ scope: "global" }).catch(() => {});
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
  } catch (e) {
    console.warn("signOut warn:", e);
  } finally {
    await hardLocalClear();

    setTimeout(() => {
      if (!redirected) window.location.replace(target);
      try { sub?.subscription?.unsubscribe?.(); } catch {}
      routing = false;
    }, 500);
  }
}

/** 메인 UI 토글(닉네임 표시/버튼) **/
async function renderIndexUI() {
  const $greet = document.getElementById("greeting");
  const $nick  = document.getElementById("nickname");
  const $login = document.getElementById("loginBtn");
  const $logout= document.getElementById("logoutBtn");
  if (!$greet || !$nick || !$login || !$logout) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // 비로그인 화면 구성
    $greet.classList.add("hide");
    $nick.textContent = "";
    $logout.classList.add("hide");
    $login.classList.remove("hide");
    return;
  }

  // 로그인 화면 구성
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const display = (!error && data?.display_name)
    ? data.display_name
    : (user.email?.split("@")[0] ?? "사용자");

  $nick.textContent = display;
  $greet.classList.remove("hide");
  $login.classList.add("hide");
  $logout.classList.remove("hide");
}

/** 닉네임 여부에 따른 라우팅 **/
async function routeByProfile() {
  if (routing) return;
  routing = true;

  const page = currentPage();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {

    if (page !== PATHS.INDEX) location.href = urlTo(PATHS.INDEX);
    routing = false;
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const hasNick = !error && !!data?.display_name;
  const dest = hasNick ? PATHS.INDEX : PATHS.SET_NICK;

  if (page !== dest.toLowerCase()) {
    location.href = urlTo(dest);
    return;
  }
  routing = false;
}


window.addEventListener("DOMContentLoaded", async () => {
  const page = currentPage();


  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  if (loginBtn) loginBtn.onclick = signInWithGoogle;
  if (logoutBtn) logoutBtn.onclick = signOut;


  const exchanged = await handleOAuthRedirectIfNeeded();


  if (page === PATHS.INDEX) {
    await renderIndexUI();

    if (exchanged) await routeByProfile();

    supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "SIGNED_OUT") {
        await renderIndexUI();
      }
    });
  }

  if (page === PATHS.SET_NICK) {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session) await routeByProfile();

    supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await routeByProfile();
      }
      if (event === "SIGNED_OUT") {
        window.location.replace(urlTo(PATHS.INDEX));
      }
    });
  }
});
