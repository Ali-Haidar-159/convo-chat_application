"use strict";

// import all the packages

import createError from "http-errors";

// create the middleware
function checkRole(roles) {
  return function (req, res, next) {
    console.log(req.user.role);
    if (roles && roles.includes(req.user.role)) {
      next();
    } else {
      throw createError("You are not authorized");
    }
  };
}

// export code

export default checkRole;
