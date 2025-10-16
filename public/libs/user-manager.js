/*
user-manager.js
: localStorage에서 로그인한 사용자 정보를 가져오거나 이벤트를 받아 정보를 저장하는 독립적인 함수들을 export하는 모듈
auth.js
:로그인/로그아웃 시 'auth-state-changed' 이벤트를 발생 -> 페이지에서 사용자 정보가 필요할 때 이 이벤트 구독
*/

const getItem = (key) => localStorage.getItem(key);

/**
 * 로그인되었을 때 사용자 정보를 LocalStorage에 저장
 *@param{object}userData - { id, email, nickname, profile_image_url, bio }
 */
export function setLoggedInUser(userData) {
  localStorage.setItem("db_id", userData.id);
  localStorage.setItem("email", userData.email);
  localStorage.setItem("nickname", userData.nickname);
  localStorage.setItem("profile_image_url", userData.profile_image_url);
  localStorage.setItem("bio", userData.bio || "");
  localStorage.setItem("isLoggedIn", "true");
  console.log(`[UserManager] User ${userData.nickname} is now logged in.`);
}

/**
 * 로그아웃 시 LocalStorage에서 사용자 정보를 삭제.
 */
export function clearUser() {
  localStorage.removeItem("db_id");
  localStorage.removeItem("email");
  localStorage.removeItem("nickname");
  localStorage.removeItem("profile_image_url");
  localStorage.removeItem("bio");
  localStorage.removeItem("isLoggedIn");
  console.log("[UserManager] User logged out.");
}

/**
 * 현재 로그인된 사용자의 모든 DB정보를 객체로 반환.
 *@returns{object|null} -> 로그인 상태가 아니면 null 반환
 */
export function getUserInfo() {
  if (getItem("isLoggedIn") !== "true") return null;
  return {
    id: getItem("db_id"),
    email: getItem("email"),
    nickname: getItem("nickname"),
    profile_image_url: getItem("profile_image_url"),
    bio: getItem("bio"),
  };
}

//하나씩 받아오기
export function getIsLoggedIn() {
  return getItem("isLoggedIn") === "true";
}
export function getUserId() {
  return getItem("db_id");
}
export function getUserEmail() {
  return getItem("email");
}
export function getUserNickname() {
  return getItem("nickname");
}
export function getProfileImageUrl() {
  return getItem("profile_image_url");
}
export function getBio() {
  return getItem("bio");
}

/**
 * 'auth-state-changed'의 이벤트 리스너 초기화
 * user-manager 함수 사용 전 먼저 호출.
 */
export function initAuthListener() {
  window.addEventListener("auth-state-changed", (event) => {
    const { loggedIn, user } = event.detail;
    if (loggedIn && user) {
      setLoggedInUser(user);
    } else {
      clearUser();
    }
  });
}

//일부 정보만 업데이트하기(마이페이지 프로필 수정용)
export function updateUserInfo(newUserData) {
  if (newUserData.nickname !== undefined) {
    localStorage.setItem("nickname", newUserData.nickname);
  }
  if (newUserData.profile_image_url !== undefined) {
    localStorage.setItem("profile_image_url", newUserData.profile_image_url);
  }
  if (newUserData.bio !== undefined) {
    localStorage.setItem("bio", newUserData.bio || "");
  }
  if (newUserData.email !== undefined) {
    localStorage.setItem("email", newUserData.email);
  }
  if (newUserData.id !== undefined) {
    localStorage.setItem("db_id", newUserData.id);
  }
  console.log(`update user : ${newUserData.nickname}, ${newUserData.bio}`);
}
