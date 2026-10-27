"use strict";

// create a global error handler

const serverErrorHandler = function (err, req, res, next) {
  const runningEnvironment = process.env.NODE_ENV;
  const error = runningEnvironment === "development" ? err : err.message;
  res.locals.error = error;
  console.log(err.message);
  if (res.locals.html) {
    return res.render("error", {
      title: "Error Page",
    });
  } else {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Find Internal Server Error!",
    });
  }
};

// exports code

export default serverErrorHandler;
