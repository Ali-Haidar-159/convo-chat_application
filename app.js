"use strict";

// import all the packages
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import path from "path";
import { fileURLToPath } from "url";

import serverErrorHandler from "./middlewares/error_handler.middleware.js";
import pageNotFoundHandler from "./middlewares/page_not_found.middleware.js";
import userDataMiddleware from "./middlewares/userData.middleware.js";

import loginRouter from "./router/login.router.js";
import userRouter from "./router/user.router.js";
import inboxRouter from "./router/inbox.router.js";

// declaration part
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
  origin: `http://localhost:${process.env.PORT}`,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

const cookieParserSecret = process.env.COOKIE_PARSER_SECRET;

// create the server
const app = express();

// connect with server
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "static")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(cookieParser(cookieParserSecret));
app.use(userDataMiddleware);

app.set("view engine", "ejs");

// request-response cycle

app.use(loginRouter);
app.use("/users", userRouter);
app.use("/inbox", inboxRouter);

// all the middlewares

app.use(pageNotFoundHandler);
app.use(serverErrorHandler);

// exports code

export default app;
