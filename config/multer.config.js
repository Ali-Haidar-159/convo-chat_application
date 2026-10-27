"use strict";

// import all the packages
import multer from "multer";
import createError from "http-errors";
import fs from "node:fs";

import path from "node:path";
import { fileURLToPath } from "url";

// declaration part

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DESTINATION = path.join(__dirname, "..", "assets");

// configure the multer

const getMulterUploader = function (fieldName, allowedFileTypes, errorMessage) {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      fs.mkdir(DESTINATION, { recursive: true }, function (err) {
        cb(err, DESTINATION);
      });
    },

    filename: function (req, file, cb) {
      const fileExt = path.extname(file.originalname);

      const fileName =
        file.originalname
          .replace(fileExt, "")
          .toLowerCase()
          .split(" ")
          .join("_") +
        "_" +
        Date.now() +
        fileExt;
      cb(null, fileName);
    },
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 10000000,
    },
    fileFilter: function (req, file, cb) {
      if (file.fieldname === fieldName) {
        if (allowedFileTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(createError(errorMessage));
        }
      } else {
        cb(createError("filed name should be avatar"));
      }
    },
  });

  return upload;
};

// exports code

export default getMulterUploader;
