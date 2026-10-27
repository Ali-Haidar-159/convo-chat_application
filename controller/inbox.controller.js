"use strict";

import mongoose from "mongoose";
import ConversationModel from "../models/conversation.model.js";
import MessagesModel from "../models/messages.model.js";
import PeopleModel from "../models/people.model.js";

const getInbox = function (req, res) {
  return res.status(200).render("inbox");
};

function getParticipantKey(firstId, secondId) {
  return [firstId.toString(), secondId.toString()].sort().join(":");
}

function serializeUser(user) {
  const id = user.id || user._id;
  return {
    id: id.toString(),
    name: user.name,
    avatar: user.avatar || null,
  };
}

async function getCurrentUser(req, res) {
  const user = await PeopleModel.findOne({ email: req.userData.email })
    .select("_id name avatar email")
    .lean();

  if (!user) {
    res.status(401).json({ message: "Your account could not be found." });
    return null;
  }

  return user;
}

const getConversations = async function (req, res) {
  try {
    const currentUser = await getCurrentUser(req, res);
    if (!currentUser) return;

    const conversations = await ConversationModel.find({
      $or: [
        { "creator.id": currentUser._id },
        { "participant.id": currentUser._id },
      ],
    })
      .sort({ updatedAt: -1 })
      .lean();

    const users = conversations.map((conversation) => {
      const currentId = currentUser._id.toString();
      const otherUser =
        conversation.creator.id.toString() === currentId
          ? conversation.participant
          : conversation.creator;

      return serializeUser(otherUser);
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Failed to load conversations:", error.message);
    return res.status(500).json({ message: "Unable to load conversations." });
  }
};

const createConversation = async function (req, res) {
  const { participantId } = req.body;

  if (
    typeof participantId !== "string" ||
    !mongoose.Types.ObjectId.isValid(participantId)
  ) {
    return res.status(400).json({ message: "A valid user is required." });
  }

  try {
    const currentUser = await getCurrentUser(req, res);
    if (!currentUser) return;

    if (currentUser._id.toString() === participantId) {
      return res.status(400).json({ message: "You cannot chat with yourself." });
    }

    const participant = await PeopleModel.findById(participantId)
      .select("_id name avatar")
      .lean();

    if (!participant) {
      return res.status(404).json({ message: "User not found." });
    }

    const participantKey = getParticipantKey(currentUser._id, participant._id);
    let conversation = await ConversationModel.findOne({ participantKey });

    if (!conversation) {
      try {
        conversation = await ConversationModel.create({
          creator: {
            id: currentUser._id,
            name: currentUser.name,
            avatar: currentUser.avatar,
          },
          participant: {
            id: participant._id,
            name: participant.name,
            avatar: participant.avatar,
          },
          participantKey,
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        conversation = await ConversationModel.findOne({ participantKey });
      }
    }

    return res.status(200).json({
      user: serializeUser(participant),
      conversationId: conversation._id.toString(),
    });
  } catch (error) {
    console.error("Failed to create conversation:", error.message);
    return res.status(500).json({ message: "Unable to create conversation." });
  }
};

const getMessages = async function (req, res) {
  const { participantId } = req.params;

  if (
    typeof participantId !== "string" ||
    !mongoose.Types.ObjectId.isValid(participantId)
  ) {
    return res.status(400).json({ message: "A valid user is required." });
  }

  try {
    const currentUser = await getCurrentUser(req, res);
    if (!currentUser) return;

    const participantKey = getParticipantKey(currentUser._id, participantId);
    const conversation = await ConversationModel.findOne({ participantKey }).lean();
    const currentUserId = currentUser._id.toString();
    const messages = conversation
      ? await MessagesModel.find({ conversation_id: conversation._id })
          .sort({ date_time: 1 })
          .lean()
      : [];

    return res.status(200).json({
      messages: messages.map((message) => ({
        id: message._id.toString(),
        senderId: message.sender.id.toString(),
        isOwn: message.sender.id.toString() === currentUserId,
        text: message.text,
        createdAt: message.date_time,
      })),
    });
  } catch (error) {
    console.error("Failed to load messages:", error.message);
    return res.status(500).json({ message: "Unable to load messages." });
  }
};

const sendMessage = async function (req, res) {
  const { participantId } = req.params;
  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";

  if (
    typeof participantId !== "string" ||
    !mongoose.Types.ObjectId.isValid(participantId)
  ) {
    return res.status(400).json({ message: "A valid user is required." });
  }

  if (!text || text.length > 5000) {
    return res.status(400).json({
      message: "Message must contain between 1 and 5000 characters.",
    });
  }

  try {
    const currentUser = await getCurrentUser(req, res);
    if (!currentUser) return;

    const participantKey = getParticipantKey(currentUser._id, participantId);
    const conversation = await ConversationModel.findOne({ participantKey });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const receiver = await PeopleModel.findById(participantId)
      .select("_id name avatar")
      .lean();

    if (!receiver) {
      return res.status(404).json({ message: "User not found." });
    }

    const savedMessage = await MessagesModel.create({
      text,
      sender: {
        id: currentUser._id,
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
      receiver: {
        id: receiver._id,
        name: receiver.name,
        avatar: receiver.avatar,
      },
      conversation_id: conversation._id,
    });
    conversation.last_updated = new Date();
    await conversation.save();

    const message = {
      id: savedMessage._id.toString(),
      senderId: currentUser._id.toString(),
      text: savedMessage.text,
      createdAt: savedMessage.date_time,
    };
    const io = req.app?.get?.("io");
    if (io) {
      io.to(`user:${receiver._id}`).emit("message:new", {
        ...message,
        isOwn: false,
        participantId: currentUser._id.toString(),
        participant: serializeUser(currentUser),
      });
      io.to(`user:${currentUser._id}`).emit("message:new", {
        ...message,
        isOwn: true,
        participantId: receiver._id.toString(),
        participant: serializeUser(receiver),
      });
    }

    return res.status(201).json({
      message: { ...message, isOwn: true },
    });
  } catch (error) {
    console.error("Failed to send message:", error.message);
    return res.status(500).json({ message: "Unable to send message." });
  }
};

export {
  getInbox,
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
};
