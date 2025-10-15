import { supabase, getSafeUserInfo } from "./userStore.js";

function basePath() {
  const p = location.pathname.endsWith("/")
    ? location.pathname
    : location.pathname.replace(/[^/]+$/, "");
  return p;
}
function urlTo(p) {
  return `${location.origin}${basePath()}${p}`;
}

const $ = (s) => document.querySelector(s);
const $name = $("#nickname");
const $save = $("#saveBtn");
const $err  = $("#err");
const $logout = $("#logoutBtn");

const NAME_RE = /^[A-Za-z0-9가-힣]{2,10}$/;

function validateFormat(name) {
  if (!name) return "사용할 닉네임을 입력해주세요.";
  if (!NAME_RE.test(name)) return "형식이 올바르지 않습니다. (2–10자, 한글/영문/숫자만 사용 가능합니다.)";
  return "";
}

async function isDuplicate(name, myId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("display_name", name)
    .neq("id", myId)
    .limit(1);

  if (error) {
    console.error("중복 검사 실패:", error);
    return false;
  }
  return !!(data && data.length > 0);
}

async function saveNickname() {
  $err.textContent = "";
  const name = ($name.value || "").trim();

  const fmt = validateFormat(name);
  if (fmt) { $err.textContent = fmt; return; }

  const me = getSafeUserInfo();
  if (!me.id) { $err.textContent = "로그인이 필요합니다."; return; }

  if (await isDuplicate(name, me.id)) {
    $err.textContent = "이미 사용 중인 닉네임입니다.";
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: name, updated_at: new Date().toISOString() })
    .eq("id", me.id);

  if (error) {
    console.error(error);
    $err.textContent = "닉네임 저장 중 오류가 발생했습니다.";
    return;
  }

  alert("닉네임이 설정되었습니다");
  window.location.href = urlTo("auth-index.html");
}

$save.addEventListener("click", saveNickname);

$logout.addEventListener("click", async () => {
  try {
    await supabase.auth.signOut({ scope: "local" });
    supabase.auth.signOut({ scope: "global" }).catch(()=>{});
  } finally {
    alert("로그아웃 되었습니다.");
    window.location.href = urlTo("auth-index.html");
  }
});
