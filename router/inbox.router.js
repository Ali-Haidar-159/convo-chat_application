"use strict";

// import all the packages
import express from "express";

import {
  createConversation,
  getConversations,
  getInbox,
  getMessages,
  sendMessage,
} from "../controller/inbox.controller.js";
import renamePageTitle from "../middlewares/renamePageTitle.middleware.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware.js";

// create the login router
const inboxRouter = express.Router();

inboxRouter.get("/", renamePageTitle("Inbox"), isAuthenticated, getInbox);
inboxRouter.get("/conversations", isAuthenticated, getConversations);
inboxRouter.post("/conversations", isAuthenticated, createConversation);
inboxRouter.get(
  "/conversations/:participantId/messages",
  isAuthenticated,
  getMessages,
);
inboxRouter.post(
  "/conversations/:participantId/messages",
  isAuthenticated,
  sendMessage,
);

// exports code

export default inboxRouter;
