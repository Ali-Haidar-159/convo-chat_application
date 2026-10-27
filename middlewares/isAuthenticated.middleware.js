"use strict";

// import all the packages
import jwt from "jsonwebtoken";
import createError from "http-errors";

function isAuthenticated(req, res, next) {
  try {
    const allCookies = req.signedCookies;

    const token = allCookies[process.env.COOKIE_NAME]
      ? allCookies[process.env.COOKIE_NAME]
      : null;

    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.userData = payload;

      if (res.locals.html) {
        res.locals.loggedInUser = payload;
      }
      req.user = payload;
      next();
    } else {
      return res.redirect("/");
    }
  } catch (err) {
    console.log(err.message);
    throw createError("Find error to check authentication");
  }
}

function redirectLoginPage(req, res, next) {
  try {
    const allCookies = req.signedCookies;

    const token = allCookies[process.env.COOKIE_NAME]
      ? allCookies[process.env.COOKIE_NAME]
      : null;

    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.userData = payload;

      if (res.locals.html) {
        res.locals.loggedInUser = payload;
      }

      return res.redirect("/inbox");
    } else {
      next();
    }
  } catch (err) {
    console.log(err.message);
    throw createError("Find error to check authentication");
  }
}

// export code

export { isAuthenticated, redirectLoginPage };
