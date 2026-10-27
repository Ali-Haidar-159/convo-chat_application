"use strict";

// import all the packages
import { check, validationResult } from "express-validator";

// create the validation code

const doLoginDataValidation = [
  check("username").trim().isLength({ min: 1 }).withMessage("Invalid username"),
  check("password").isLength({ min: 6 }).withMessage("Invalid password"),
];

const doLoginDataValidationResult = function (req, res, next) {
  const errors = validationResult(req);
  const mappedError = errors.mapped();

  if (Object.keys(mappedError).length === 0) {
    next();
  } else {
    res.status(400).render("login", {
      data: {
        username: req.body.username,
      },
      errors: {
        error: mappedError,
      },
    });
  }
};

// exports code

export { doLoginDataValidation, doLoginDataValidationResult };
