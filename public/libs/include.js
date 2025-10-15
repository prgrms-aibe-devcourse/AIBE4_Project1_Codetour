document.addEventListener("DOMContentLoaded", async () => {
  const headerElement = document.querySelector("header");

  if (headerElement) {
    const response = await fetch("/my-page/_header.html");
    if (response.ok) {
      headerElement.innerHTML = await response.text();
    }
  }
});
