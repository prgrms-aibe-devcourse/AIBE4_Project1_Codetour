import { supabase } from "./userStore.js";
import * as userManager from "../libs/user-manager.js";

document.addEventListener("DOMContentLoaded", async () => {
  userManager.initAuthListener();

  const nicknameInput = document.getElementById("nickname");
  const saveBtn = document.getElementById("saveBtn");
  const errDiv = document.getElementById("err");
  const prefCheckboxes = document.querySelectorAll('input[name="pref"]');

  // 현재 사용자 정보 가져오기
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("로그인이 필요합니다.");
    window.location.href = "/auth";
    return;
  }

  // 기존 프로필 정보 불러오기
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    // 이미 닉네임이 있으면 리디렉트
    if (profile && profile.display_name) {
      console.log("이미 닉네임이 설정되어 있습니다. 리디렉트합니다.");
      const returnUrl = sessionStorage.getItem("returnUrl");
      if (returnUrl) {
        sessionStorage.removeItem("returnUrl");
        window.location.href = returnUrl;
      } else {
        window.location.href = "/";
      }
      return;
    }

    if (profile) {
      nicknameInput.value = profile.display_name || "";
    }

    // 기존 선호도 불러오기
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("categories")
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      preferences &&
      preferences.categories &&
      Array.isArray(preferences.categories)
    ) {
      preferences.categories.forEach((pref) => {
        const checkbox = document.querySelector(
          `input[name="pref"][value="${pref}"]`
        );
        if (checkbox) checkbox.checked = true;
      });
    }
  } catch (e) {
    console.warn("프로필 불러오기 실패:", e);
  }

  // 저장 버튼 클릭
  saveBtn.addEventListener("click", async () => {
    const nickname = nicknameInput.value.trim();
    errDiv.textContent = "";

    // 닉네임 유효성 검사
    if (!nickname) {
      errDiv.textContent = "닉네임을 입력해주세요.";
      return;
    }

    if (nickname.length < 2 || nickname.length > 10) {
      errDiv.textContent = "닉네임은 2~10자로 입력해주세요.";
      return;
    }

    const regex = /^[가-힣a-zA-Z0-9]+$/;
    if (!regex.test(nickname)) {
      errDiv.textContent = "한글, 영문, 숫자만 사용 가능합니다.";
      return;
    }

    // 선호 카테고리 수집
    const preferences = Array.from(prefCheckboxes)
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "저장 중...";

      // 1. 프로필 업데이트 (email 포함)
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email,
          display_name: nickname,
        },
        {
          onConflict: "id",
        }
      );

      if (profileError) {
        console.error("프로필 저장 오류:", profileError);
        throw profileError;
      }

      // 2. 선호도 저장 (user_preferences 테이블)
      if (preferences.length > 0) {
        const { error: prefError } = await supabase
          .from("user_preferences")
          .upsert(
            {
              user_id: user.id,
              categories: preferences,
            },
            {
              onConflict: "user_id",
            }
          );

        if (prefError) {
          console.error("선호도 저장 오류:", prefError);
          // 선호도 저장 실패는 무시하고 계속 진행
        }
      }

      // 3. user manager 업데이트
      userManager.updateUserInfo({
        id: user.id,
        email: user.email,
        nickname: nickname,
      });

      alert("프로필이 저장되었습니다!");

      // returnUrl이 있으면 그곳으로, 없으면 홈으로 이동
      const returnUrl = sessionStorage.getItem("returnUrl");
      if (returnUrl) {
        sessionStorage.removeItem("returnUrl");
        window.location.href = returnUrl;
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      errDiv.textContent = "저장 중 오류가 발생했습니다. 다시 시도해주세요.";
      saveBtn.disabled = false;
      saveBtn.textContent = "저장";
    }
  });

  // Enter 키로 저장
  nicknameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      saveBtn.click();
    }
  });
});
