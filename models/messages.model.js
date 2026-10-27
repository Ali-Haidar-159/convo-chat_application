"use strict";

// import all the packages
import mongoose from "mongoose";

// create the messages schema
const messagesSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    attachment: String,
    sender: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Peoples", required: true },
      name: { type: String, required: true },
      avatar: String,
    },
    receiver: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Peoples", required: true },
      name: { type: String, required: true },
      avatar: String,
    },
    date_time: {
      type: Date,
      default: Date.now,
    },
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

messagesSchema.index({ conversation_id: 1, date_time: 1 });

const MessagesModel = mongoose.model("Messages", messagesSchema);

// exports code

export default MessagesModel;
