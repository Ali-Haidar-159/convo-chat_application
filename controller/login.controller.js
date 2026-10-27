"use strict";

import { compare, hash } from "bcrypt";
import jwt from "jsonwebtoken";

import PeopleModel from "../models/people.model.js";

const SALT_ROUNDS = 10;

function createLoginCookie(res, user) {
  const userData = {
    email: user.email,
    mobile: user.mobile,
    username: user.name,
    role: user.role,
  };
  const token = jwt.sign(userData, process.env.JWT_SECRET, {
    expiresIn: 86400000,
  });

  res.cookie(process.env.COOKIE_NAME, token, {
    httpOnly: true,
    signed: true,
    maxAge: 86400000,
  });
  return userData;
}

const getLogin = function (req, res) {
  return res.status(200).render("login");
};

const getSignup = function (req, res) {
  return res.status(200).render("signup");
};

const postLogin = async function (req, res) {
  const username = req.body.username;
  const user = await PeopleModel.findOne({
    $or: [{ email: username.toLowerCase() }, { mobile: username }],
  });

  const isMatchPass = user
    ? await compare(req.body.password, user.password)
    : false;

  if (!user || !isMatchPass) {
    return res.status(401).render("login", {
      data: { username },
      errors: {
        error: {
          username: { msg: "Invalid username or password" },
        },
      },
    });
  }

  const userObj = createLoginCookie(res, user);
  req.user = userObj;
  res.locals.userData = userObj;
  return res.render("inbox");
};

const postSignup = async function (req, res) {
  try {
    const user = await PeopleModel.create({
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      mobile: req.body.mobile.trim(),
      password: await hash(req.body.password, SALT_ROUNDS),
    });

    const userData = createLoginCookie(res, user);
    res.locals.userData = userData;
    return res.redirect("/inbox");
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      const message =
        field === "mobile"
          ? "An account with this mobile number already exists."
          : "An account with this email already exists.";
      return res.status(409).render("signup", {
        data: req.body,
        errors: { [field || "email"]: message },
      });
    }

    console.error("Failed to create account:", error.message);
    return res.status(500).render("signup", {
      data: req.body,
      errors: {
        common: "Unable to create your account right now. Please try again.",
      },
    });
  }
};

const logOut = function (req, res) {
  res.clearCookie(process.env.COOKIE_NAME, {
    httpOnly: true,
    path: "/",
    signed: true,
  });
  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

export { getLogin, getSignup, logOut, postLogin, postSignup };
