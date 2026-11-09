
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// Serve JBK Auction website
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Server status
app.get("/status", (req, res) => {
  res.json({
    project: "JBK Auction",
    status: "online",
    tiktok: "connection_pending"
  });
});

// TikTok LIVE
async function startTikTok() {
  const username = process.env.TIKTOK_USERNAME;

  if (!username) {
    console.log("Missing TIKTOK_USERNAME");
    return;
  }

  try {
    const { TikTokLiveConnection, WebcastEvent } =
      await import("tiktok-live-connector");

    const connection = new TikTokLiveConnection(username, {
      processInitialData: false
    });

    connection.on(WebcastEvent.GIFT, (event) => {
      io.emit("gift", {
        username: event.user?.uniqueId || "Unknown",
        nickname: event.user?.nickname || "Viewer",
        gift: event.giftDetails?.giftName || "Gift",
        coins: event.giftDetails?.diamondCount || 0,
        repeat: event.repeatCount || 1
      });
    });

    connection.on(WebcastEvent.CHAT, (event) => {
      io.emit("chat", {
        username: event.user?.uniqueId || "Unknown",
        comment: event.comment || event.content || ""
      });
    });

    connection.on("connected", () => {
      console.log("TikTok LIVE connected!");
      io.emit("tiktok_status", { connected: true });
    });

    connection.on("disconnected", () => {
      console.log("TikTok LIVE disconnected");
      io.emit("tiktok_status", { connected: false });
    });

    connection.on("error", (error) => {
      console.log("TikTok event error:", error);
    });

    console.log("Connecting to TikTok LIVE:", username);
    await connection.connect();

  } catch (error) {
    console.error("TikTok connection failed:", error);
  }
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("JBK Auction server running on port " + PORT);
  startTikTok();
});
