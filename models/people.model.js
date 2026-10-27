"use strict";

// import all the packages
import mongoose from "mongoose";
import { type } from "os";

// create people model
const peopleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    avatar: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

const PeopleModel = mongoose.model("Peoples", peopleSchema);

// exports code

export default PeopleModel;
