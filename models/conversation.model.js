"use strict";

// import all the packages
import mongoose from "mongoose";

// create conversation schema

const conversationSchema = new mongoose.Schema(
  {
    creator: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Peoples", required: true },
      name: { type: String, required: true },
      avatar: String,
    },
    participant: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Peoples", required: true },
      name: { type: String, required: true },
      avatar: String,
    },
    participantKey: {
      type: String,
      required: true,
    },
    last_updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

conversationSchema.index({ "creator.id": 1, updatedAt: -1 });
conversationSchema.index({ "participant.id": 1, updatedAt: -1 });
conversationSchema.index(
  { participantKey: 1 },
  { unique: true, partialFilterExpression: { participantKey: { $type: "string" } } },
);

const ConversationModel = mongoose.model("Conversation", conversationSchema);

// export codes

export default ConversationModel;
