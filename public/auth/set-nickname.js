import { supabase, getSafeUserInfo } from "./userStore.js";

/* ---------- 경로 유틸 ---------- */
function basePath() {
  return location.pathname.endsWith("/")
    ? location.pathname
    : location.pathname.replace(/[^/]+$/, "");
}
function urlTo(p) {
  if (!p) return `${location.origin}${basePath()}`;
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith("/")) return `${location.origin}${p}`;
  return `${location.origin}${basePath()}${p}`;
}
const PATHS = window.AUTH_PATHS ?? { INDEX: "index.html", SET_NICK: "set-nickname.html" };
function goHome() {
  const dest = PATHS.INDEX || "index.html";
  const url = (/^https?:\/\//i.test(dest) || dest.startsWith("/")) ? dest : urlTo(dest);
  // replace + 안전망
  location.replace(url);
  setTimeout(() => {
    try {
      if (location.href !== new URL(url, location.href).href) location.href = url;
    } catch {
      location.href = url;
    }
  }, 80);
}

/* ---------- DOM ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const $name   = $("#nickname");
const $save   = $("#saveBtn");
const $err    = $("#err");
const $logout = $("#logoutBtn");

/* ---------- 검증 ---------- */
const NAME_RE = /^[A-Za-z0-9가-힣]{2,10}$/;
function validateFormat(name) {
  if (!name) return "사용할 닉네임을 입력해주세요.";
  if (!NAME_RE.test(name)) return "형식이 올바르지 않습니다. (2–10자, 한글/영문/숫자)";
  return "";
}

/* ---------- 저장 ---------- */
async function saveNicknameAndPreferences(e) {
  e?.preventDefault?.();
  e?.stopPropagation?.();
  $err.textContent = "";

  const me = getSafeUserInfo();
  if (!me.id) { $err.textContent = "로그인이 필요합니다."; return; }

  const name = ($name?.value || "").trim();
  const fmt = validateFormat(name);
  if (fmt) { $err.textContent = fmt; return; }

  // 체크박스 수집 (name="pref" 또는 data-pref 지원)
  const selected = Array.from(new Set([
    ...$$('input[name="pref"]:checked').map(el => (el.value || "").trim()),
    ...$$('input[type="checkbox"][data-pref]:checked').map(el => (el.dataset.pref || "").trim()),
  ].filter(Boolean)));

  try {
    // 1) 닉네임 upsert
    const { error: upErr } = await supabase
      .from("profiles")
      .upsert(
        { id: me.id, display_name: name, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
    if (upErr) throw new Error(`닉네임 저장 실패: ${upErr.message}`);

    // 2) 선호 카테고리 upsert  (⚠️ undefined 방지: 빈 배열이라도 넣기)
    const { error: prefErr } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: me.id, categories: selected ?? [] },
        { onConflict: "user_id" }
      );
    if (prefErr) throw new Error(`선호 카테고리 저장 실패: ${prefErr.message}`);

    alert("저장되었습니다.");
    goHome();
  } catch (err) {
    console.error("[set-nickname] save error:", err);
    $err.textContent = err.message || "저장 중 오류가 발생했습니다.";
    alert($err.textContent);
  }
}

/* ---------- 이벤트 ---------- */
$name?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); $save?.click(); }
});
$save?.addEventListener("click", saveNicknameAndPreferences);

$logout?.addEventListener("click", async (e) => {
  e?.preventDefault?.();
  try {
    await supabase.auth.signOut({ scope: "local" });
    supabase.auth.signOut({ scope: "global" }).catch(()=>{});
  } finally {
    alert("로그아웃 되었습니다.");
    goHome();
  }
});
