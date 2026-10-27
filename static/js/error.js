"use strict";

const retryButton = document.querySelector("[data-retry]");

retryButton?.addEventListener("click", () => {
  window.location.reload();
});
