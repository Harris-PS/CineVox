# CineVox — YouTube-Powered Watch Party Platform

A full-stack synchronized watch-party platform using **YouTube** as the free video backend. Zero paid services required.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 + Tailwind CSS + Zustand |
| **Backend** | Node.js + Express |
| **Database** | MongoDB Atlas (free tier) |
| **Real-time** | Socket.io (playback sync + chat) |
| **Video** | YouTube IFrame Player API (free) |
| **Auth** | JWT (access tokens) |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas free tier)

### 1. Backend Setup

```bash
cd server
npm install

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI

# Start the server
npm run dev
```

Backend runs on `http://localhost:4000`

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## Default Admin Account

| Email | Password |
|-------|----------|
| admin@cinevox.app | admin123 |

The admin account is auto-seeded on first server start.

---

## Project Structure

```
├── server/                     # Express + MongoDB + Socket.io
│   ├── src/
│   │   ├── models/             # Mongoose schemas (User, Media, Room, Friend, Message)
│   │   ├── routes/             # REST API routes (auth, media, rooms, friends)
│   │   ├── middleware/          # JWT auth middleware
│   │   └── index.js            # Server entry + Socket.io gateway
│   └── .env.example
├── client/                     # Next.js App Router
│   └── src/
│       ├── app/                # Pages: home, media/[id], watch/[id], watch/new, friends, login, register, admin, movies, anime, mylist
│       ├── components/         # Navbar, YouTubePlayer (IFrame API wrapper)
│       └── lib/                # API client, auth store, utils
└── README.md
```

---

## How It Works

### Video System (100% Free)
1. Admin uploads videos to YouTube manually and sets them as **Unlisted**
2. Admin adds the YouTube URL in the CMS — the app extracts the `videoId`
3. Thumbnails are auto-fetched from `img.youtube.com/vi/{id}/maxresdefault.jpg`
4. Videos are played via the **YouTube IFrame Player API** with custom controls

### Watch Party Sync
1. Host creates a room and controls playback (play/pause/seek)
2. Actions are emitted via **Socket.io** to the server
3. Server broadcasts to all connected clients in the room
4. Late joiners auto-sync to the current timestamp
5. All clients use `player.playVideo()`, `player.pauseVideo()`, `player.seekTo()` for sync

### Real-Time Chat
- Room-based messaging via Socket.io
- Chat history stored in MongoDB
- Messages broadcast to all room participants

### Friends System
- Send/reject/accept friend requests by email
- Online status tracking via `lastSeenAt` timestamps
- Invite friends to watch parties via room links

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (email, password, displayName) |
| POST | `/api/auth/login` | Login (email, password) |
| GET | `/api/auth/me` | Get current user |

### Media
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/media` | List published media |
| GET | `/api/media/trending` | Get trending content |
| GET | `/api/media/:id` | Get media details |
| POST | `/api/media` | Create media (admin) |
| PUT | `/api/media/:id` | Update media (admin) |
| DELETE | `/api/media/:id` | Delete media (admin) |
| GET | `/api/media/admin/all` | Admin: list all media |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms` | List public rooms |
| GET | `/api/rooms/:id` | Get room details |
| POST | `/api/rooms` | Create room (auth) |
| POST | `/api/rooms/:id/join` | Join room (auth) |
| POST | `/api/rooms/:id/leave` | Leave room (auth) |
| DELETE | `/api/rooms/:id` | Delete room (host) |

### Friends
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/friends` | List friends |
| POST | `/api/friends/request` | Send friend request |
| POST | `/api/friends/request/:id/accept` | Accept request |
| DELETE | `/api/friends/request/:id` | Reject request |
| DELETE | `/api/friends/:id` | Remove friend |
| GET | `/api/friends/pending` | List pending requests |

### Socket.io Events (`/`)
| Event | Direction | Description |
|-------|-----------|-------------|
| `room:join` | Client → Server | Join watch room |
| `room:leave` | Client → Server | Leave watch room |
| `room:state` | Server → Client | Current room state |
| `playback:play` | Both | Play (host controls) |
| `playback:pause` | Both | Pause (host controls) |
| `playback:seek` | Both | Seek (host controls) |
| `chat:message` | Both | Chat message |
| `chat:history` | Server → Client | Chat history |

---

## Environment Variables

### Server (`.env`)
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/cinevox
JWT_SECRET=cinevox-jwt-secret-change-me
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Client (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

---

## Design System

**Theme: "Aether Cinema"**
- Background: `#0e0e0e`
- Accent: `#b6a0ff`
- Neon Green: `#00ff88`
- Glass-morphism cards with backdrop blur
- Smooth animations (fade-in, slide-up)

---

## License

MIT
