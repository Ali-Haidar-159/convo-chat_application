"use strict";

// import all the packages
import createError from "http-errors";

const pageNotFoundHandler = function (req, res, next) {
  const err = createError(404, "Page Not Found");
  res.locals.html = true;
  next(err);
};

// exports code

export default pageNotFoundHandler;
