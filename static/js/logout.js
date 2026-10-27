"use strict";

document.addEventListener("click", async function (event) {
  const logoutButton = event.target.closest("[data-logout-button]");
  if (!logoutButton) return;

  logoutButton.disabled = true;

  try {
    const response = await fetch("/", { method: "DELETE" });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `Logout failed (${response.status}).`);
    }

    Toastify({
      text: result.message,
      duration: 1800,
      close: true,
      gravity: "top",
      position: "right",
      backgroundColor: "#4caf50",
    }).showToast();

    window.setTimeout(function () {
      window.location.assign("/");
    }, 1800);
  } catch (error) {
    Toastify({
      text: error.message || "Unable to log out. Please try again.",
      duration: 3000,
      close: true,
      gravity: "top",
      position: "right",
      backgroundColor: "#e74c3c",
    }).showToast();
    logoutButton.disabled = false;
  }
});
