const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 4243;
const LISTENER_TTL_MS = 90 * 1000;
const clientDistPath = path.join(__dirname, "..", "client", "dist");
const indexHtmlPath = path.join(clientDistPath, "index.html");

const listenerSessions = new Map();

const comments = [
  {
    id: 1,
    name: "Tamika",
    location: "Chicago, IL",
    message: "Listening live and grateful for this word-filled station.",
    createdAt: "2026-04-19T18:00:00.000Z",
  },
  {
    id: 2,
    name: "Deacon Marcus",
    location: "Peoria, IL",
    message: "The worship and prayer flow here keeps our home encouraged.",
    createdAt: "2026-04-19T18:08:00.000Z",
  },
];

const requests = [
  {
    id: 3,
    name: "Sister Yolanda",
    email: "listener@example.com",
    song: "Take Me to the King",
    artist: "Tamela Mann",
    dedication: "Praying for strength and comfort for my family this week.",
    createdAt: "2026-04-20T01:20:00.000Z",
  },
  {
    id: 4,
    name: "Brother Allen",
    email: "worshipper@example.com",
    song: "Blessed Assurance",
    artist: "Traditional",
    dedication: "Please dedicate this to everyone listening during Morning Worship.",
    createdAt: "2026-04-20T02:05:00.000Z",
  },
];

const contactMessages = [
  {
    id: 5,
    name: "Monique",
    email: "prayer@example.com",
    phone: "",
    topic: "Prayer request",
    message: "Please keep my family in prayer and agreement for healing.",
    createdAt: "2026-04-20T00:35:00.000Z",
  },
  {
    id: 6,
    name: "Elder James",
    email: "testimony@example.com",
    phone: "",
    topic: "Testimony",
    message: "The station has been a blessing in our home all week. Thank you for the Word.",
    createdAt: "2026-04-20T01:50:00.000Z",
  },
];

function getActiveListenerCount() {
  const now = Date.now();

  for (const [sessionId, lastSeen] of listenerSessions.entries()) {
    if (now - lastSeen > LISTENER_TTL_MS) {
      listenerSessions.delete(sessionId);
    }
  }

  return listenerSessions.size;
}

function createId() {
  return Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
}

app.use(cors());
app.use(express.json());

app.get("/api/station", (_req, res) => {
  res.json({
    listenerCount: getActiveListenerCount(),
    comments,
    latestRequests: requests.slice(-5).reverse(),
    latestMessages: contactMessages.slice(-5).reverse(),
  });
});

app.post("/api/listeners/heartbeat", (req, res) => {
  const { sessionId } = req.body ?? {};

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "A valid sessionId is required." });
  }

  listenerSessions.set(sessionId, Date.now());

  return res.json({ listenerCount: getActiveListenerCount() });
});

app.get("/api/comments", (_req, res) => {
  res.json({
    listenerCount: getActiveListenerCount(),
    comments,
  });
});

app.post("/api/comments", (req, res) => {
  const { name, location, message } = req.body ?? {};

  if (!name || !message) {
    return res.status(400).json({ error: "Name and message are required." });
  }

  const comment = {
    id: createId(),
    name: String(name).trim(),
    location: String(location ?? "").trim(),
    message: String(message).trim(),
    createdAt: new Date().toISOString(),
  };

  comments.unshift(comment);
  comments.splice(12);

  return res.status(201).json({
    comment,
    listenerCount: getActiveListenerCount(),
  });
});

app.post("/api/requests", (req, res) => {
  const { name, email, song, artist, dedication } = req.body ?? {};

  if (!name || !email || !song) {
    return res
      .status(400)
      .json({ error: "Name, email, and song request are required." });
  }

  const request = {
    id: createId(),
    name: String(name).trim(),
    email: String(email).trim(),
    song: String(song).trim(),
    artist: String(artist ?? "").trim(),
    dedication: String(dedication ?? "").trim(),
    createdAt: new Date().toISOString(),
  };

  requests.unshift(request);
  requests.splice(20);

  return res.status(201).json({
    success: true,
    message: "Your gospel music request has been received.",
    request,
  });
});

app.post("/api/contact", (req, res) => {
  const { name, email, phone, topic, message } = req.body ?? {};

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: "Name, email, and message are required." });
  }

  const messageEntry = {
    id: createId(),
    name: String(name).trim(),
    email: String(email).trim(),
    phone: String(phone ?? "").trim(),
    topic: String(topic ?? "").trim(),
    message: String(message).trim(),
    createdAt: new Date().toISOString(),
  };

  contactMessages.unshift(messageEntry);
  contactMessages.splice(20);

  return res.status(201).json({
    success: true,
    message: "Your message has been sent to the ministry team.",
    messageEntry,
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    listenerCount: getActiveListenerCount(),
  });
});

setInterval(() => {
  getActiveListenerCount();
}, 30 * 1000);

app.use(express.static(clientDistPath));

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }

  return res.sendFile(indexHtmlPath);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
