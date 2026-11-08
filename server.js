
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.get("/", (req, res) => {
  res.send("JBK Auction Event Server Online");
});

async function startTikTok() {
  const username = process.env.TIKTOK_USERNAME;

  if (!username) {
    console.log("TIKTOK_USERNAME is not configured");
    return;
  }

  const { TikTokLiveConnection, WebcastEvent } =
    await import("tiktok-live-connector");

  const connection = new TikTokLiveConnection(username);

  connection.on(WebcastEvent.GIFT, (event) => {
    io.emit("gift", {
      username: event.user?.displayId || "Unknown",
      nickname: event.user?.nickname || "Viewer",
      gift: event.giftDetails?.giftName || "Gift",
      coins: event.giftDetails?.diamondCount || 0,
      repeat: event.repeatCount || 1
    });
  });

  connection.on(WebcastEvent.CHAT, (event) => {
    io.emit("chat", {
      username: event.user?.displayId || "Unknown",
      comment: event.content || ""
    });
  });

  connection.on("error", (error) => {
    console.log("TikTok connection error:", error.message);
  });

  try {
    await connection.connect();
    console.log("TikTok LIVE connected");
  } catch (error) {
    console.log("TikTok connection failed:", error.message);
  }
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("JBK Auction server running on port " + PORT);
  startTikTok();
});
