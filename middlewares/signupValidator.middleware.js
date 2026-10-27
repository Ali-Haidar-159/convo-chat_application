"use strict";

import { body, validationResult } from "express-validator";
import PeopleModel from "../models/people.model.js";

const signupDataValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be between 2 and 80 characters."),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address.")
    .bail()
    .normalizeEmail()
    .custom(async function (email) {
      if (await PeopleModel.exists({ email })) {
        throw new Error("An account with this email already exists.");
      }
    }),
  body("mobile")
    .trim()
    .matches(/^\d{11}$/)
    .withMessage("Enter an 11-digit mobile number.")
    .bail()
    .custom(async function (mobile) {
      if (await PeopleModel.exists({ mobile })) {
        throw new Error("An account with this mobile number already exists.");
      }
    }),
  body("password")
    .isLength({ min: 8, max: 100 })
    .withMessage("Password must be at least 8 characters.")
    .bail()
    .isStrongPassword()
    .withMessage(
      "Use a mix of uppercase and lowercase letters, a number, and a symbol.",
    ),
];

function signupValidationResult(req, res, next) {
  const errors = validationResult(req).mapped();
  if (Object.keys(errors).length === 0) {
    return next();
  }

  const fieldErrors = Object.fromEntries(
    Object.entries(errors).map(([field, error]) => [field, error.msg]),
  );
  return res.status(400).render("signup", {
    data: {
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
    },
    errors: fieldErrors,
  });
}

export { signupDataValidation, signupValidationResult };
