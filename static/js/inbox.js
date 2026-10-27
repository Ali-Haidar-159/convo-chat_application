"use strict";

const modal = document.querySelector("#new-conversation-modal");
const openModalButton = document.querySelector("#new-conversation-button");
const closeModalButton = modal.querySelector(".modal-close");
const searchInput = document.querySelector("#user-search-input");
const searchStatus = document.querySelector("#user-search-status");
const searchResults = document.querySelector("#user-search-results");
const conversationList = document.querySelector("#conversation-list");
const chatContactName = document.querySelector("#chat-contact-name");
const chatMessageList = document.querySelector("#chat-message-list");
const chatEmptyState = document.querySelector("#chat-empty-state");
const chatStatus = document.querySelector("#chat-status");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const sendMessageButton = document.querySelector("#send-message-button");
const socket = io();

const contacts = new Map();
let activeParticipantId;
let searchTimeout;
let searchController;
let hasConnected = false;

function closeModal() {
  window.clearTimeout(searchTimeout);
  modal.style.display = "none";
  searchInput.value = "";
  searchResults.replaceChildren();
  searchStatus.textContent = "";
  if (searchController) {
    searchController.abort();
    searchController = undefined;
  }
}

function openModal() {
  modal.style.display = "block";
  searchInput.focus();
}

function createAvatar(user, alt) {
  const image = document.createElement("img");
  image.src = user.avatar
    ? `/assets/${encodeURIComponent(user.avatar)}`
    : "/images/user1.png";
  image.alt = alt;
  return image;
}

function addContact(user) {
  const existing = contacts.get(user.id);
  if (existing) {
    return existing.element;
  }

  const contact = document.createElement("button");
  contact.type = "button";
  contact.className = "conversation";
  contact.dataset.userId = user.id;
  contact.append(createAvatar(user, ""));

  const name = document.createElement("span");
  name.className = "title-text";
  name.textContent = user.name;
  contact.append(name);

  const description = document.createElement("span");
  description.className = "conversation-message";
  description.textContent = "Click to open chat";
  contact.append(description);

  conversationList.querySelector(".conversation-empty")?.remove();
  conversationList.append(contact);
  contacts.set(user.id, { ...user, element: contact });
  return contact;
}

function showSearchResults(users) {
  searchResults.replaceChildren();

  if (users.length === 0) {
    searchStatus.textContent = "No users found.";
    return;
  }

  searchStatus.textContent = "Select a user to add them to your conversations.";
  users.forEach(function (user) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "user-search-result";
    button.append(createAvatar(user, ""));

    const name = document.createElement("span");
    name.textContent = user.name;
    button.append(name);
    button.addEventListener("click", async function () {
      button.disabled = true;
      searchStatus.textContent = "Adding conversation...";

      try {
        const response = await fetch("/inbox/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ participantId: user.id }),
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || `Unable to add user (${response.status}).`);
        }

        const contact = addContact(result.user);
        closeModal();
        contact.focus();
      } catch (error) {
        button.disabled = false;
        searchStatus.textContent = error.message || "Unable to add this user.";
      }
    });

    item.append(button);
    searchResults.append(item);
  });
}

async function searchUsers(name, controller) {
  try {
    const response = await fetch(`/users/search?name=${encodeURIComponent(name)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `User search failed (${response.status}).`);
    }

    if (controller === searchController) {
      showSearchResults(result.users);
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    if (controller === searchController) {
      searchStatus.textContent = error.message || "Unable to search users.";
    }
  }
}

function renderMessage(message, user) {
  if (
    message.id &&
    chatMessageList.querySelector(`[data-message-id="${CSS.escape(message.id)}"]`)
  ) {
    return;
  }

  const row = document.createElement("div");
  row.className = `message-row ${message.isOwn ? "you-message" : "other-message"}`;
  if (message.id) {
    row.dataset.messageId = message.id;
  }

  const content = document.createElement("div");
  content.className = "message-content";

  if (!message.isOwn) {
    content.append(createAvatar(user, user.name));
  }

  const text = document.createElement("div");
  text.className = "message-text";
  text.textContent = message.text;
  content.append(text);

  const time = document.createElement("div");
  time.className = "message-time";
  time.textContent = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  content.append(time);

  row.append(content);
  chatMessageList.append(row);
}

async function loadMessages(user) {
  activeParticipantId = user.id;
  chatContactName.textContent = user.name;
  chatInput.disabled = false;
  sendMessageButton.disabled = false;
  chatInput.placeholder = "Type a message";
  chatStatus.textContent = "";
  chatEmptyState.textContent = "Loading messages...";
  chatEmptyState.hidden = false;
  chatMessageList.querySelectorAll(".message-row").forEach((row) => row.remove());

  try {
    const response = await fetch(
      `/inbox/conversations/${encodeURIComponent(user.id)}/messages`,
      { headers: { Accept: "application/json" } },
    );
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `Unable to load messages (${response.status}).`);
    }

    if (activeParticipantId !== user.id) {
      return;
    }

    chatEmptyState.hidden = result.messages.length > 0;
    chatEmptyState.textContent = `No messages yet. Send a message to ${user.name}.`;
    result.messages.forEach((message) => renderMessage(message, user));
    chatMessageList.scrollTop = chatMessageList.scrollHeight;
  } catch (error) {
    if (activeParticipantId === user.id) {
      chatEmptyState.hidden = false;
      chatEmptyState.textContent = "Unable to load messages. Please try again.";
      chatStatus.textContent = error.message || "Unable to load messages.";
    }
  }
}

async function loadConversations() {
  try {
    const response = await fetch("/inbox/conversations", {
      headers: { Accept: "application/json" },
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `Unable to load conversations (${response.status}).`);
    }

    result.users.forEach(addContact);
  } catch (error) {
    const emptyState = conversationList.querySelector(".conversation-empty");
    if (emptyState) {
      emptyState.textContent = error.message || "Unable to load conversations.";
    }
  }
}

socket.on("connect", function () {
  if (hasConnected && activeParticipantId) {
    const activeUser = contacts.get(activeParticipantId);
    if (activeUser) {
      loadMessages(activeUser);
    }
  }
  hasConnected = true;
});

socket.on("connect_error", function () {
  if (activeParticipantId) {
    chatStatus.textContent = "Real-time connection unavailable. Reconnecting...";
  }
});

socket.on("message:new", function (message) {
  if (!message || typeof message.participantId !== "string") {
    return;
  }

  let user = contacts.get(message.participantId);
  if (!user && message.participant) {
    addContact(message.participant);
    user = contacts.get(message.participantId);
  }
  if (!user) {
    return;
  }

  const preview = user.element.querySelector(".conversation-message");
  if (preview) {
    preview.textContent = message.text;
  }

  if (activeParticipantId === message.participantId) {
    chatEmptyState.hidden = true;
    chatStatus.textContent = "";
    renderMessage(message, user);
    chatMessageList.scrollTop = chatMessageList.scrollHeight;
  }
});

openModalButton.addEventListener("click", function (event) {
  event.preventDefault();
  openModal();
});

closeModalButton.addEventListener("click", closeModal);
modal.addEventListener("click", function (event) {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && modal.style.display === "block") {
    closeModal();
  }
});

searchInput.addEventListener("input", function () {
  window.clearTimeout(searchTimeout);
  if (searchController) {
    searchController.abort();
    searchController = undefined;
  }

  const name = searchInput.value.trim();
  searchResults.replaceChildren();
  if (!name) {
    searchStatus.textContent = "";
    return;
  }

  searchStatus.textContent = "Searching...";
  searchTimeout = window.setTimeout(function () {
    searchController = new AbortController();
    searchUsers(name, searchController);
  }, 250);
});

conversationList.addEventListener("click", function (event) {
  const contact = event.target.closest(".conversation");
  if (!contact) {
    return;
  }

  conversationList.querySelector(".conversation.active")?.classList.remove("active");
  contact.classList.add("active");

  const user = contacts.get(contact.dataset.userId);
  if (user) {
    loadMessages(user);
    chatInput.focus();
  }
});

chatForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text || !activeParticipantId) {
    return;
  }

  const participantId = activeParticipantId;
  sendMessageButton.disabled = true;
  chatStatus.textContent = "";

  try {
    const response = await fetch(
      `/inbox/conversations/${encodeURIComponent(participantId)}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ text }),
      },
    );
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `Unable to send message (${response.status}).`);
    }

    const user = contacts.get(participantId);
    if (user && activeParticipantId === participantId) {
      chatEmptyState.hidden = true;
      renderMessage(result.message, user);
      chatMessageList.scrollTop = chatMessageList.scrollHeight;
      if (chatInput.value.trim() === text) {
        chatInput.value = "";
      }
    }
  } catch (error) {
    if (activeParticipantId === participantId) {
      chatStatus.textContent = error.message || "Unable to send message.";
    }
  } finally {
    sendMessageButton.disabled = !activeParticipantId;
    chatInput.focus();
  }
});

loadConversations();
