"use strict";

// import all the packages
import chalk from "chalk";
import { createServer } from "http";
import { Server } from "socket.io";

import app from "./app.js";
import connectDB from "./config/db.config.js";
import configureChatSocket from "./sockets/chat.socket.js";

// declaration part
const port = process.env.PORT;
const db_connectionString = process.env.DB_LINK;
const consoleDesign = chalk.bgRed.bold.italic;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: `http://localhost:${port}`,
    credentials: true,
  },
});

configureChatSocket(io);
app.set("io", io);

// connect to the database before accepting HTTP and socket connections
await connectDB(db_connectionString);

httpServer.listen(port, function () {
  console.log(
    consoleDesign(`Server is running at http://localhost:${port} ...`),
  );
});
