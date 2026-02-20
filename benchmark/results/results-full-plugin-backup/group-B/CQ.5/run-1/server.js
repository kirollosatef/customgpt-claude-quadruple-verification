const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 8080;
const MAX_HISTORY = 50;

// --- State ---
const rooms = new Map();       // roomName -> { users: Set<ws>, history: Array<{nickname, text, timestamp}> }
const clients = new Map();     // ws -> { nickname: string|null, room: string|null }
const nicknames = new Set();   // globally unique nicknames

// --- Helpers ---

function send(ws, type, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type, ...payload }));
  }
}

function sendError(ws, message) {
  send(ws, "error", { message });
}

function broadcastToRoom(roomName, type, payload, exclude) {
  const room = rooms.get(roomName);
  if (!room) return;
  for (const member of room.users) {
    if (member !== exclude) {
      send(member, type, payload);
    }
  }
}

function getClientByNickname(nickname) {
  for (const [ws, info] of clients.entries()) {
    if (info.nickname === nickname) return ws;
  }
  return null;
}

function listRooms() {
  const list = [];
  for (const [name, room] of rooms.entries()) {
    list.push({ name, userCount: room.users.size });
  }
  return list;
}

function listRoomUsers(roomName) {
  const room = rooms.get(roomName);
  if (!room) return [];
  const users = [];
  for (const member of room.users) {
    const info = clients.get(member);
    if (info && info.nickname) users.push(info.nickname);
  }
  return users;
}

function leaveCurrentRoom(ws) {
  const info = clients.get(ws);
  if (!info || !info.room) return;

  const roomName = info.room;
  const room = rooms.get(roomName);
  if (room) {
    room.users.delete(ws);
    broadcastToRoom(roomName, "user_left", {
      nickname: info.nickname,
      room: roomName,
      users: listRoomUsers(roomName),
    });
    if (room.users.size === 0) {
      rooms.delete(roomName);
    }
  }
  info.room = null;
}

// --- Message handlers ---

const handlers = {
  set_nickname(ws, data) {
    const info = clients.get(ws);
    const name = (data.nickname || "").trim();

    if (!name) return sendError(ws, "Nickname cannot be empty.");
    if (name.length > 30) return sendError(ws, "Nickname must be 30 characters or fewer.");
    if (nicknames.has(name)) return sendError(ws, `Nickname "${name}" is already taken.`);

    // Release old nickname
    if (info.nickname) {
      nicknames.delete(info.nickname);
      // Notify room members of the rename
      if (info.room) {
        broadcastToRoom(info.room, "nickname_changed", {
          oldNickname: info.nickname,
          newNickname: name,
          room: info.room,
        }, ws);
      }
    }

    nicknames.add(name);
    info.nickname = name;
    send(ws, "nickname_set", { nickname: name });
  },

  create_room(ws, data) {
    const info = clients.get(ws);
    if (!info.nickname) return sendError(ws, "Set a nickname first.");

    const roomName = (data.room || "").trim();
    if (!roomName) return sendError(ws, "Room name cannot be empty.");
    if (roomName.length > 50) return sendError(ws, "Room name must be 50 characters or fewer.");
    if (rooms.has(roomName)) return sendError(ws, `Room "${roomName}" already exists.`);

    // Leave current room if in one
    leaveCurrentRoom(ws);

    rooms.set(roomName, { users: new Set([ws]), history: [] });
    info.room = roomName;

    send(ws, "room_joined", {
      room: roomName,
      users: [info.nickname],
      history: [],
    });
  },

  join_room(ws, data) {
    const info = clients.get(ws);
    if (!info.nickname) return sendError(ws, "Set a nickname first.");

    const roomName = (data.room || "").trim();
    if (!roomName) return sendError(ws, "Room name cannot be empty.");
    if (!rooms.has(roomName)) return sendError(ws, `Room "${roomName}" does not exist.`);
    if (info.room === roomName) return sendError(ws, "You are already in that room.");

    // Leave current room if in one
    leaveCurrentRoom(ws);

    const room = rooms.get(roomName);
    room.users.add(ws);
    info.room = roomName;

    // Send room state + history to the joining user
    send(ws, "room_joined", {
      room: roomName,
      users: listRoomUsers(roomName),
      history: room.history,
    });

    // Notify others
    broadcastToRoom(roomName, "user_joined", {
      nickname: info.nickname,
      room: roomName,
      users: listRoomUsers(roomName),
    }, ws);
  },

  leave_room(ws) {
    const info = clients.get(ws);
    if (!info.room) return sendError(ws, "You are not in any room.");

    const roomName = info.room;
    leaveCurrentRoom(ws);
    send(ws, "room_left", { room: roomName });
  },

  message(ws, data) {
    const info = clients.get(ws);
    if (!info.nickname) return sendError(ws, "Set a nickname first.");
    if (!info.room) return sendError(ws, "Join a room first.");

    const text = (data.text || "").trim();
    if (!text) return sendError(ws, "Message cannot be empty.");

    const room = rooms.get(info.room);
    if (!room) return sendError(ws, "Room no longer exists.");

    const entry = {
      nickname: info.nickname,
      text,
      timestamp: Date.now(),
    };

    // Store in history (cap at MAX_HISTORY)
    room.history.push(entry);
    if (room.history.length > MAX_HISTORY) {
      room.history.shift();
    }

    // Broadcast to everyone in the room including sender
    for (const member of room.users) {
      send(member, "message", {
        room: info.room,
        nickname: info.nickname,
        text,
        timestamp: entry.timestamp,
      });
    }
  },

  private_message(ws, data) {
    const info = clients.get(ws);
    if (!info.nickname) return sendError(ws, "Set a nickname first.");

    const target = (data.to || "").trim();
    const text = (data.text || "").trim();

    if (!target) return sendError(ws, "Recipient nickname is required.");
    if (!text) return sendError(ws, "Message cannot be empty.");
    if (target === info.nickname) return sendError(ws, "Cannot send a private message to yourself.");

    const targetWs = getClientByNickname(target);
    if (!targetWs) return sendError(ws, `User "${target}" is not online.`);

    const timestamp = Date.now();

    // Deliver to recipient
    send(targetWs, "private_message", {
      from: info.nickname,
      text,
      timestamp,
    });

    // Confirm to sender
    send(ws, "private_message_sent", {
      to: target,
      text,
      timestamp,
    });
  },

  list_rooms(ws) {
    send(ws, "room_list", { rooms: listRooms() });
  },

  list_users(ws) {
    const info = clients.get(ws);
    if (!info.room) return sendError(ws, "Join a room first.");
    send(ws, "user_list", { room: info.room, users: listRoomUsers(info.room) });
  },
};

// --- Server ---

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  clients.set(ws, { nickname: null, room: null });

  send(ws, "welcome", {
    message: "Connected. Set a nickname with { type: \"set_nickname\", nickname: \"...\"}.",
  });

  ws.on("message", (raw) => {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return sendError(ws, "Invalid JSON.");
    }

    const handler = handlers[data.type];
    if (!handler) {
      return sendError(ws, `Unknown message type: "${data.type}".`);
    }

    handler(ws, data);
  });

  ws.on("close", () => {
    const info = clients.get(ws);
    if (info) {
      leaveCurrentRoom(ws);
      if (info.nickname) nicknames.delete(info.nickname);
    }
    clients.delete(ws);
  });
});

console.log(`Chat server listening on ws://localhost:${PORT}`);
