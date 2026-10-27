"use strict";

// import all the packages
import getMulterUploader from "../config/multer.config.js";

function avatarUpload(req, res, next) {
  const upload = getMulterUploader(
    "avatar",
    ["image/png", "image/jpg", "image/jpeg"],
    "Only give .png/.jpg/.jpeg files.",
  );

  upload.any()(req, res, function (err) {
    if (err) {
      res.status(400).json({
        errors: {
          avatar: {
            message: err.message,
          },
        },
      });
    } else {
      next();
    }
  });
}

// exports code
export default avatarUpload;
