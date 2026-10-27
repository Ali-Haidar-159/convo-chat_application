"use strict";

import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import PeopleModel from "../models/people.model.js";

function configureChatSocket(io) {
  io.engine.use(cookieParser(process.env.COOKIE_PARSER_SECRET));

  io.use(async function (socket, next) {
    try {
      const token =
        socket.request.signedCookies?.[process.env.COOKIE_NAME];

      if (!token) {
        return next(new Error("Authentication required."));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (typeof payload !== "object" || typeof payload.email !== "string") {
        return next(new Error("Invalid authentication token."));
      }

      const user = await PeopleModel.findOne({ email: payload.email })
        .select("_id")
        .lean();

      if (!user) {
        return next(new Error("Authenticated user was not found."));
      }

      socket.data.userId = user._id.toString();
      return next();
    } catch (error) {
      console.error("Socket authentication failed:", error.message);
      return next(new Error("Authentication failed."));
    }
  });

  io.on("connection", function (socket) {
    socket.join(`user:${socket.data.userId}`);
  });
}

export default configureChatSocket;
