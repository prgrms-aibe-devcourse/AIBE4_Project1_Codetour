const UserManager = (function () {
  let instance;

  function createInstance() {
    // Load state from sessionStorage
    let db_id = sessionStorage.getItem("db_id");
    let email = sessionStorage.getItem("email");
    let nickname = sessionStorage.getItem("nickname");
    let profile_image_url = sessionStorage.getItem("profile_image_url");
    let bio = sessionStorage.getItem("bio");
    let isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
    let isInitialized = sessionStorage.getItem("isInitialized") === "true";

    return {
      setLoggedInUser: function (userData) {
        db_id = userData.id;
        email = userData.email;
        nickname = userData.nickname;
        profile_image_url = userData.profile_image_url;
        bio = userData.bio;
        isLoggedIn = true;

        // Save state to sessionStorage
        sessionStorage.setItem("db_id", db_id);
        sessionStorage.setItem("email", email);
        sessionStorage.setItem("nickname", nickname);
        sessionStorage.setItem("profile_image_url", profile_image_url);
        sessionStorage.setItem("bio", bio || ""); // Ensure we don't store "null"
        sessionStorage.setItem("isLoggedIn", "true");

        console.log(`User ${nickname} is now logged in.`);
      },
      clearUser: function () {
        db_id = null;
        email = null;
        nickname = null;
        profile_image_url = null;
        bio = null;
        isLoggedIn = false;
        isInitialized = false;

        // Clear state from sessionStorage
        sessionStorage.removeItem("db_id");
        sessionStorage.removeItem("email");
        sessionStorage.removeItem("nickname");
        sessionStorage.removeItem("profile_image_url");
        sessionStorage.removeItem("bio");
        sessionStorage.removeItem("isLoggedIn");
        sessionStorage.removeItem("isInitialized");

        console.log("User logged out.");
      },
      setIsInitialized: function (value) {
        isInitialized = value;
        sessionStorage.setItem("isInitialized", value);
      },
      getIsInitialized: function () {
        return isInitialized;
      },
      getIsLoggedIn: function () {
        return isLoggedIn;
      },
      getUserId: function () {
        return db_id;
      },
      getUserEmail: function () {
        return email;
      },
      getUserNickname: function () {
        return nickname;
      },
      getProfileImageUrl: function () {
        return profile_image_url;
      },
      getBio: function () {
        return bio;
      },
      getUserInfo: function () {
        if (!isLoggedIn) return null;
        return {
          id: db_id,
          email: email,
          nickname: nickname,
          profile_image_url: profile_image_url,
          bio: bio,
        };
      },
      updateUserInfo: function (newUserData) {
        if (newUserData.nickname !== undefined) {
          nickname = newUserData.nickname;
          sessionStorage.setItem("nickname", nickname);
        }
        if (newUserData.profile_image_url !== undefined) {
          profile_image_url = newUserData.profile_image_url;
          sessionStorage.setItem("profile_image_url", profile_image_url);
        }
        if (newUserData.bio !== undefined) {
          bio = newUserData.bio;
          sessionStorage.setItem("bio", bio || "");
        }
        console.log(`update user : ${nickname}, ${bio}`);
      },
    };
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
  };
})();

const userManager = UserManager.getInstance();

//테스트용
function testCode() {
  if (!userManager.getIsLoggedIn() && !userManager.getIsInitialized()) {
    console.log("테스트 코드 실행");
    const userData = {
      id: "3a1e2ae0-71e6-4618-a2bc-ed5ccbdc3e74",
      email: "user@example.com",
      nickname: "1013test",
      profile_image_url: "https://example.com/profile.jpg",
      bio: null,
    };
    userManager.setLoggedInUser(userData);
    userManager.setIsInitialized(true);
  }
}

testCode();
