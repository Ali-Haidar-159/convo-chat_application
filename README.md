# Convo — Real-Time Chat Application

Convo is a server-rendered chat application built with Node.js, Express, EJS, MongoDB, and Socket.IO. Users can create an account, find other users, start conversations, and exchange messages in real time.

## Features

- Account signup with validated name, email, mobile number, and password.
- Password hashing with bcrypt and signed, HTTP-only authentication cookies.
- Login with email address or mobile number.
- User search and one-to-one conversations.
- Persistent conversations and messages stored in MongoDB.
- Real-time message delivery through authenticated Socket.IO connections.
- Responsive login, signup, inbox, and user-management pages.
- Optional avatar uploads for user accounts.

## Technology

- Node.js (20.19+ or 22+)
- Express 5
- MongoDB with Mongoose
- EJS templates
- Socket.IO 4
- bcrypt and JSON Web Tokens

## Requirements

- Node.js 20.19 or newer (or Node.js 22+)
- npm
- A reachable MongoDB instance, local or hosted

## Getting started

1. Install the project dependencies:

   ```sh
   npm install
   ```

2. Create a `.env` file in the project root and configure the required environment variables:

   ```dotenv
   PORT=3000
   DB_LINK=mongodb://127.0.0.1:27017/convo
   APPLICATION_NAME=Convo
   COOKIE_NAME=convo_session
   COOKIE_PARSER_SECRET=replace-with-a-long-random-secret
   JWT_SECRET=replace-with-a-different-long-random-secret
   ```

   Use unique, randomly generated secrets in every environment. Do not commit `.env` or share production credentials.

3. Start the development server:

   ```sh
   npm start
   ```

4. Open `http://localhost:3000` in a browser. Create an account from the home page to get started.

For production mode, configure production environment variables and run:

```sh
npm run prod
```

The application connects to MongoDB before it starts accepting HTTP and Socket.IO connections.

## Available scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the development server with Nodemon |
| `npm run prod` | Start the production-mode Node.js server |

## Application routes

| Method | Path | Description | Access |
| --- | --- | --- | --- |
| `GET` | `/` | Login page | Public |
| `POST` | `/` | Authenticate with email or mobile and password | Public |
| `GET` | `/signup` | Account creation page | Public |
| `POST` | `/signup` | Validate and create an account, then sign in | Public |
| `DELETE` | `/` | Sign out | Application session |
| `GET` | `/inbox` | Chat inbox | Authenticated |
| `GET` | `/inbox/conversations` | List the signed-in user's conversations | Authenticated |
| `POST` | `/inbox/conversations` | Create or retrieve a conversation | Authenticated |
| `GET` | `/inbox/conversations/:participantId/messages` | Load a conversation's messages | Authenticated |
| `POST` | `/inbox/conversations/:participantId/messages` | Store and broadcast a message | Authenticated |
| `GET` | `/users/search?name=...` | Search for users by name | Authenticated |
| `GET` | `/users` | Manage users | Authenticated administrator |
| `POST` | `/users` | Create a user and optionally upload an avatar | Authenticated |
| `DELETE` | `/users/:id` | Delete a user | **Currently has no route-level authentication** |

## Real-time messaging

The browser connects to the Socket.IO server using the same signed authentication cookie used by the web application. The server verifies the token and joins the socket to a private room for that account.

When a message is sent, the HTTP endpoint validates the participants and stores the message in MongoDB first. After persistence succeeds, the server emits a `message:new` event to the sender's and recipient's private rooms. The client updates an open chat immediately and reloads message history when reconnecting.

## Project layout

```text
config/        Database configuration
controller/    Request handlers and application logic
middlewares/   Authentication, validation, and error handling
models/        Mongoose user, conversation, and message models
router/        Express route definitions
sockets/       Socket.IO authentication and connection setup
static/        Browser JavaScript, stylesheets, and static images
views/         EJS page templates
assets/        Runtime user-upload storage; do not commit uploaded files
app.js         Express application and middleware setup
index.js       HTTP server, Socket.IO, database startup, and listener
```

## Security and production deployment

- Keep `.env`, authentication secrets, and uploaded files out of source control.
- Use strong, independently generated `JWT_SECRET` and `COOKIE_PARSER_SECRET` values.
- **Before production, protect `DELETE /users/:id`.** The current route does not apply authentication or role checks.
- User creation at `POST /users` requires authentication but currently has no administrator-role check. Add the authorization policy required by your deployment before exposing it.
- The account signup form creates standard users. Provision administrator access through a controlled administrative process, not public signup.
- Serve production traffic over HTTPS. Review cookie `secure` and `sameSite` settings before deploying; update them to match the deployment architecture.
- Restrict database credentials and network access to the application.
- The current CORS configuration is intended for same-origin/local development. Configure trusted production origins explicitly if the browser client and API are hosted on different origins.
- Persist and back up the `assets/` directory separately if uploaded avatars must survive deployments.
- Avatar uploads currently accept PNG and JPEG files.
- Socket.IO rooms are in-memory and assume a single application process. Multi-instance deployments need a shared Socket.IO adapter (for example, a Redis adapter) and appropriately configured sticky sessions.
- Run behind a maintained reverse proxy or managed ingress, and configure request limits, TLS termination, monitoring, and log retention for the deployment.

## Development notes

The project does not currently define a test or lint script in `package.json`. Validate changes with focused checks and exercise signup, authentication, conversation creation, and real-time messaging against a non-production MongoDB database.
