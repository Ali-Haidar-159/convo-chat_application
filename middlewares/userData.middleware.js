"use strict";

import jwt from "jsonwebtoken";

const userDataMiddleware = function (req, res, next) {
  res.locals.userData = {};
  const token = req.signedCookies[process.env.COOKIE_NAME];

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, function (err, userData) {
    if (err) {
      if (
        err.name === "JsonWebTokenError" ||
        err.name === "TokenExpiredError" ||
        err.name === "NotBeforeError"
      ) {
        return next();
      }
      return next(err);
    }

    res.locals.userData = userData;
    return next();
  });
};

export default userDataMiddleware;
