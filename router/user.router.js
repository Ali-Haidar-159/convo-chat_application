"use strict";

// import all the packages
import express from "express";

import {
  addUser,
  getUser,
  removeUser,
  searchUsers,
} from "../controller/user.controller.js";
import renamePageTitle from "../middlewares/renamePageTitle.middleware.js";
import avatarUpload from "../utils/singleUploader.utils.js";
import {
  dataValidationHandler,
  userDataValidator,
} from "../middlewares/userValidator.middleware.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware.js";
import checkRole from "../middlewares/checkRole.middleware.js";

// create the login router
const userRouter = express.Router();

userRouter.get("/search", isAuthenticated, searchUsers);
userRouter.get(
  "/",
  renamePageTitle("User"),
  isAuthenticated,
  checkRole(["admin"]),
  getUser,
);
userRouter.post(
  "/",
  isAuthenticated,
  avatarUpload,
  userDataValidator,
  dataValidationHandler,
  addUser,
);

userRouter.delete("/:id", removeUser);

// exports code

export default userRouter;
