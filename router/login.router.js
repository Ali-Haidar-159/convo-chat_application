"use strict";

// import all the packages
import express from "express";

import {
  getLogin,
  getSignup,
  logOut,
  postLogin,
  postSignup,
} from "../controller/login.controller.js";
import renamePageTitle from "../middlewares/renamePageTitle.middleware.js";
import {
  doLoginDataValidation,
  doLoginDataValidationResult,
} from "../middlewares/loginValidator.middleware.js";

import { redirectLoginPage } from "../middlewares/isAuthenticated.middleware.js";
import {
  signupDataValidation,
  signupValidationResult,
} from "../middlewares/signupValidator.middleware.js";

// create the login router
const loginRouter = express.Router();

loginRouter.get("/", redirectLoginPage, renamePageTitle("Login"), getLogin);
loginRouter.get(
  "/signup",
  redirectLoginPage,
  renamePageTitle("Create account"),
  getSignup,
);
loginRouter.post(
  "/signup",
  renamePageTitle("Create account"),
  signupDataValidation,
  signupValidationResult,
  postSignup,
);
loginRouter.post(
  "/",
  renamePageTitle("Login"),
  doLoginDataValidation,
  doLoginDataValidationResult,
  postLogin,
);

loginRouter.delete("/", logOut);

// exports code

export default loginRouter;
