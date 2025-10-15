const UserManager = (function () {
  let instance;

  function createInstance() {
    // Load state from localStorage (changed from sessionStorage for persistence)
    let db_id = localStorage.getItem("db_id");
    let email = localStorage.getItem("email");
    let nickname = localStorage.getItem("nickname");
    let profile_image_url = localStorage.getItem("profile_image_url");
    let bio = localStorage.getItem("bio");
    let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    let isInitialized = localStorage.getItem("isInitialized") === "true";

    return {
      setLoggedInUser: function (userData) {
        db_id = userData.id;
        email = userData.email;
        nickname = userData.nickname;
        profile_image_url = userData.profile_image_url;
        bio = userData.bio;
        isLoggedIn = true;

        // Save state to localStorage (changed from sessionStorage for persistence)
        localStorage.setItem("db_id", db_id);
        localStorage.setItem("email", email);
        localStorage.setItem("nickname", nickname);
        localStorage.setItem("profile_image_url", profile_image_url);
        localStorage.setItem("bio", bio || ""); // Ensure we don't store "null"
        localStorage.setItem("isLoggedIn", "true");

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

        // Clear state from localStorage (changed from sessionStorage for persistence)
        localStorage.removeItem("db_id");
        localStorage.removeItem("email");
        localStorage.removeItem("nickname");
        localStorage.removeItem("profile_image_url");
        localStorage.removeItem("bio");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("isInitialized");

        console.log("User logged out.");
      },
      setIsInitialized: function (value) {
        isInitialized = value;
        localStorage.setItem("isInitialized", value);
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
          localStorage.setItem("nickname", nickname);
        }
        if (newUserData.profile_image_url !== undefined) {
          profile_image_url = newUserData.profile_image_url;
          localStorage.setItem("profile_image_url", profile_image_url);
        }
        if (newUserData.bio !== undefined) {
          bio = newUserData.bio;
          localStorage.setItem("bio", bio || "");
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

// //테스트용
// function testCode() {
//   if (!userManager.getIsLoggedIn() && !userManager.getIsInitialized()) {
//     console.log("테스트 코드 실행");
//     const userData = {
//       id: "3a1e2ae0-71e6-4618-a2bc-ed5ccbdc3e74",
//       email: "user@example.com",
//       nickname: "1013test",
//       profile_image_url: "https://example.com/profile.jpg",
//       bio: null,
//     };
//     userManager.setLoggedInUser(userData);
//     userManager.setIsInitialized(true);
//   }
// }

// testCode();
