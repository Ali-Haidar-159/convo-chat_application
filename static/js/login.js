"use strict";

const loginForm = document.querySelector("[data-login-form]");
const formMessage = document.querySelector("[data-form-message]");

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.textContent =
    "Login is not connected to an authentication service yet.";
});
