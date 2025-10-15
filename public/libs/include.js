document.addEventListener("DOMContentLoaded", async () => {
  const headerElement = document.querySelector("header");
  const navElement = document.querySelector("nav");

  if (headerElement) {
    const response = await fetch("/my-page/_header.html");
    if (response.ok) {
      headerElement.innerHTML = await response.text();
    }
  }

  if (navElement) {
    const response = await fetch("/my-page/_nav.html");
    if (response.ok) {
      navElement.innerHTML = await response.text();

      // nav active
      const currentPagePath = window.location.pathname;
      const navLinks = navElement.querySelectorAll(".nav-tabs li");

      navLinks.forEach((link) => {
        const linkText = link.textContent.trim();
        // /my-page폴더 하에 있는 경우 마이페이지 활성화
        if (currentPagePath.includes("my-page") && linkText === "마이페이지") {
          link.classList.add("active");
        }
      });
    }
  }
});
