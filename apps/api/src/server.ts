import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "socket.io";
import { config } from "./config.js";
import { router } from "./routes.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.webOrigin,
    methods: ["GET", "POST"]
  }
});

app.set("io", io);
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: config.webOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    limit: config.rateLimitMax,
    standardHeaders: "draft-7",
    legacyHeaders: false
  })
);
app.use("/api/v1", router);

io.on("connection", (socket) => {
  socket.emit("dashboard.connected", { at: new Date().toISOString() });
  socket.on("dashboard.subscribe", (room: string) => {
    socket.join(room);
  });
});

httpServer.listen(config.port, () => {
  console.log(`MARKAZ DAKWAH DIGITAL API listening on port ${config.port}`);
});
