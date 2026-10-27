"use strict";

// import all the packages
import mongoose from "mongoose";

// connect server with DB

const connectDB = async function (connectionString) {
  try {
    await mongoose.connect(connectionString);
    console.log("Database Is Connected Successfully");
  } catch (err) {
    console.log("find error to connect the database. Error is : ", err.message);
    throw new Error(
      `Find error to connect the Database.Error is : ${err.message}`,
    );
  }
};

// exports code

export default connectDB;
