"use strict";

// import all the packages
import { check, validationResult } from "express-validator";
import createError from "http-errors";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import PeopleModel from "../models/people.model.js";

// declaration part
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// create a validator

const userDataValidator = [
  check("name")
    .trim()
    .isLength({ min: 1 })
    .withMessage(
      "Name is required and contain should be greater than 1 character",
    ),
  check("email")
    .trim()
    .isEmail()
    .withMessage("Give a valid email address")
    .custom(async function (value) {
      try {
        const user = await PeopleModel.findOne({ email: value });

        if (user) {
          throw createError("This email is already exists!!!");
        }
      } catch (err) {
        throw createError(err.message);
      }
    }),
  check("mobile")
    .trim()
    .isLength({ min: 11, max: 11 })
    .withMessage("give a valid mobile number")
    .custom(async function (value) {
      try {
        const user = await PeopleModel.findOne({ mobile: value });

        if (user) {
          throw createError("This mobile is already exists!!!");
        }
      } catch (err) {
        throw createError(err.message);
      }
    }),
  check("password")
    .trim()
    .isLength({ min: 6, max: 100 })
    .isStrongPassword()
    .withMessage("Password should be string and length 6>password>10"),
];

function dataValidationHandler(req, res, next) {
  const errors = validationResult(req);
  const mappedErrors = errors.mapped();

  if (Object.keys(mappedErrors).length === 0) {
    next();
  } else {
    if (req.files.length > 0) {
      const fileName = req.files[0].filename;
      const filePath = path.join(__dirname, "..", "assets", fileName);
      fs.unlink(filePath, function (err) {
        if (err) {
          console.error("Failed to remove uploaded file:", err.message);
        }
      });
    }

    res.status(400).json({
      errors: mappedErrors,
    });
  }
}

// exports code

export { userDataValidator, dataValidationHandler };
