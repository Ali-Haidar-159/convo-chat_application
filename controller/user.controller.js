"use strict";

// import all the packages
import { hash } from "bcrypt";
import createError from "http-errors";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import PeopleModel from "../models/people.model.js";

// declaration part
const SALT_ROUNDS = 10;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// all the controller

const getUser = async function (req, res) {
  try {
    const users = await PeopleModel.find();

    if (users && users.length > 0) {
      return res.status(200).render("users", {
        users: users,
      });
    } else {
      return res.status(200).render("users", { users: [] });
    }
  } catch (err) {
    console.log(err.message);
    throw createError(400, "Find error to  get users");
  }
};

const searchUsers = async function (req, res) {
  const name = typeof req.query.name === "string" ? req.query.name.trim() : "";

  if (!name) {
    return res.status(200).json({ users: [] });
  }

  try {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const users = await PeopleModel.find({
      name: { $regex: escapedName, $options: "i" },
      email: { $ne: req.userData.email },
    })
      .select("_id name avatar")
      .limit(10)
      .lean();

    return res.status(200).json({
      users: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        avatar: user.avatar || null,
      })),
    });
  } catch (err) {
    console.error("Failed to search users:", err.message);
    return res.status(500).json({
      message: "Unable to search users right now.",
    });
  }
};

const addUser = async function (req, res) {
  try {
    const hashedPass = await hash(req.body.password, SALT_ROUNDS);

    if (req.files && req.files.length > 0) {
      const newUser = await PeopleModel.create({
        ...req.body,
        password: hashedPass,
        avatar: req.files[0].filename,
      });

      return res.status(201).json({
        success: true,
        message: "New User Is Created Successfully",
      });
    } else {
      const newUser = await PeopleModel.create({
        ...req.body,
        password: hashedPass,
      });

      return res.status(201).json({
        success: true,
        message: "New User Is Created Successfully",
      });
    }
  } catch (err) {
    return res.status(500).json({
      errors: {
        common: {
          message: err.message,
        },
      },
    });
  }
};

const removeUser = async function (req, res) {
  try {
    const removedUser = await PeopleModel.findByIdAndDelete(req.params.id);

    if (!removedUser) {
      return res.status(404).json({
        errors: {
          common: {
            message: "User not found.",
          },
        },
      });
    }

    if (removedUser.avatar) {
      fs.unlink(
        path.join(__dirname, "..", "assets", removedUser.avatar),
        function (err) {
          if (err) {
            console.error("Failed to remove user avatar:", err.message);
          }
        },
      );
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (err) {
    return res.status(400).json({
      errors: {
        common: {
          message: err.message,
        },
      },
    });
  }
};

// exports code

export { getUser, searchUsers, addUser, removeUser };
