<div align="center">

# ⚡ IEEE SPS — Aditya University

### Signal Processing Society · Student Branch Chapter

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-ieeespsaditya.vercel.app-00AEEF?style=for-the-badge)](https://ieeespsaditya.vercel.app)
[![Backend](https://img.shields.io/badge/🔗_Backend-Render-46E3B7?style=for-the-badge)](VITE_API_URL)

![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

<br/>

**A full-stack web platform for managing events, team members, registrations, and communications for the IEEE Signal Processing Society Student Branch Chapter at Aditya University, Surampalem.**

<br/>

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🌐 Public Website
- 🎨 Premium UI with **dark/light mode**
- 💎 Glassmorphism, neon glows & smooth animations
- ⚡ Cyberpunk-themed loading screen
- 🔤 Scroll-triggered font cycling on hero
- 📅 Dynamic events listing from database
- 👥 Team member profiles with priority ordering
- 📩 Contact form with email validation
- 📱 Fully responsive (mobile-first)

</td>
<td width="50%">

### 🔐 Admin Dashboard
- 🔑 JWT-secured admin authentication
- 📅 Create / Edit / Delete events with image gallery
- 👥 Manage team members with photo uploads
- 📩 View & manage contact messages (read/unread)
- 📊 Registration analytics with charts
- 📥 Export registrations to Excel
- 📄 Generate PDF receipts
- 🖼️ Cloudinary-powered gallery management

</td>
</tr>
<tr>
<td width="50%">

### 📝 Event Registration System
- 📋 Multi-step registration form (6 steps)
- 💰 UPI payment with screenshot verification
- 🏨 Optional accommodation booking
- 🛡️ 13-point server-side validation
- 🚫 Anti-spam honeypot + rate limiting
- 🔢 Auto-generated registration IDs

</td>
<td width="50%">

### 🤖 Integrations
- 📲 **Telegram Bot** — real-time registration alerts with inline Confirm/Reject buttons
- 📧 **Brevo Email** — automated confirmation emails with PDF receipts attached
- ☁️ **Cloudinary** — image upload, storage & CDN
- 📊 **Recharts** — dashboard analytics
- 🎉 **Confetti** — celebration effects

</td>
</tr>
</table>

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose |
|:-----------|:--------|
| [React 18](https://react.dev) | UI framework |
| [TypeScript](https://typescriptlang.org) | Type safety |
| [Vite 5](https://vitejs.dev) | Build tool & dev server |
| [Tailwind CSS 3](https://tailwindcss.com) | Utility-first styling |
| [Framer Motion](https://motion.dev) | Animations & transitions |
| [React Router 6](https://reactrouter.com) | Client-side routing |
| [shadcn/ui](https://ui.shadcn.com) | 49 pre-built Radix UI components |
| [Lucide React](https://lucide.dev) | Icon library |
| [Recharts](https://recharts.org) | Dashboard charts |
| [Axios](https://axios-http.com) | HTTP client |

### Backend

| Technology | Purpose |
|:-----------|:--------|
| [Node.js](https://nodejs.org) | Runtime environment |
| [Express 5](https://expressjs.com) | REST API framework |
| [MongoDB](https://mongodb.com) + [Mongoose 9](https://mongoosejs.com) | Database & ODM |
| [JWT](https://jwt.io) | Authentication tokens |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Password hashing |
| [Cloudinary](https://cloudinary.com) + [Multer](https://github.com/expressjs/multer) | Image upload & storage |
| [Brevo](https://brevo.com) | Transactional emails |
| [PDFKit](https://pdfkit.org) | PDF receipt generation |
| [Telegram Bot API](https://core.telegram.org/bots/api) | Admin notifications |

---

## 📁 Project Structure

```
ieee-sps-website/
│
├── src/                          # Frontend source
│   ├── components/               # 12 custom components
│   │   ├── Navbar.tsx            # Glassmorphism nav with scroll spy
│   │   ├── HeroSection.tsx       # Full-screen hero with font cycling
│   │   ├── AboutSection.tsx      # Mission, vision & highlights
│   │   ├── StatsSection.tsx      # Chapter impact statistics
│   │   ├── EventsSection.tsx     # Events list from API
│   │   ├── TeamSection.tsx       # Team grid from API
│   │   ├── ContactSection.tsx    # Contact form
│   │   ├── Footer.tsx            # Socials with neon glow
│   │   ├── LoadingScreen.tsx     # Cyberpunk loading animation
│   │   ├── ThemeToggle.tsx       # Dark/light mode
│   │   └── ui/                   # 49 shadcn/ui components
│   │
│   ├── pages/                    # 10 page components
│   │   ├── Home.tsx              # Landing page
│   │   ├── AdminLogin.tsx        # Admin auth
│   │   ├── Dashboard.tsx         # Admin control panel (75KB)
│   │   ├── ArduinoDays.tsx       # Arduino Days 2026 event page
│   │   ├── Register.tsx          # Multi-step registration (71KB)
│   │   ├── EventDetails.tsx      # Single event + gallery
│   │   ├── TeamDetails.tsx       # Member profile
│   │   └── NotFound.tsx          # 404 page
│   │
│   ├── hooks/                    # Custom React hooks
│   └── lib/                      # Utilities
│
├── backend/                      # Backend source
│   ├── server.js                 # Express entry point
│   ├── config/
│   │   └── cloudinary.js         # Cloudinary setup
│   ├── middleware/
│   │   └── verifyToken.js        # JWT auth middleware
│   ├── models/                   # 6 Mongoose schemas
│   │   ├── admin.js
│   │   ├── event.js
│   │   ├── team.js
│   │   ├── contact.js
│   │   ├── registration.js
│   │   └── counter.js
│   ├── routes/                   # 7 API route modules
│   │   ├── adminRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── teamRoutes.js
│   │   ├── contactRoutes.js
│   │   ├── registrationRoutes.js # 924 lines — full reg flow
│   │   ├── uploadRoutes.js
│   │   └── galleryRoutes.js
│   ├── controllers/
│   │   └── galleryController.js
│   └── utils/
│       ├── mailer.js             # Brevo email sender
│       └── receiptTemplate.js    # HTML email template
│
└── public/                       # Static assets & logos
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v18+)
- [MongoDB Atlas](https://mongodb.com/atlas) account
- [Cloudinary](https://cloudinary.com) account
- [Brevo](https://brevo.com) account (for emails)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Sanjaykumar9441/ieee-sps-website.git
cd ieee-sps-website
```

### 2️⃣ Setup Frontend

```bash
npm install
npm run dev
```
> Opens at `http://localhost:5173`

### 3️⃣ Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` folder:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

BREVO_API_KEY=your_brevo_api_key

TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

Start the server:

```bash
node server.js
```
> Runs at `http://localhost:5000`

---

## 🔌 API Reference

<details>
<summary><b>🔐 Admin</b></summary>

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `POST` | `/admin/login` | ❌ | Login → returns JWT (1 day expiry) |

</details>

<details>
<summary><b>📅 Events</b></summary>

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `GET` | `/events` | ❌ | Get all events |
| `GET` | `/events/:id` | ❌ | Get single event |
| `POST` | `/events` | ✅ | Create event (+ image upload) |
| `PUT` | `/events/:id` | ✅ | Update event |
| `DELETE` | `/events/:id` | ✅ | Delete event |

</details>

<details>
<summary><b>👥 Team</b></summary>

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `GET` | `/team` | ❌ | Get all members (sorted by priority) |
| `GET` | `/team/:id` | ❌ | Get single member |
| `POST` | `/team` | ✅ | Add member (+ photo upload) |
| `PUT` | `/team/:id` | ✅ | Update member |
| `DELETE` | `/team/:id` | ✅ | Delete member |

</details>

<details>
<summary><b>📩 Contact</b></summary>

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `POST` | `/contact` | ❌ | Submit message |
| `GET` | `/contact` | ✅ | Get all messages |
| `DELETE` | `/contact/:id` | ✅ | Delete message |

</details>

<details>
<summary><b>📝 Registration</b></summary>

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `GET` | `/api/registrations` | ✅ | Get all registrations |
| `GET` | `/api/check-team` | ❌ | Check duplicate team name |
| `POST` | `/api/register` | ❌ | Submit registration (rate-limited) |
| `PUT` | `/api/confirm/:id` | ✅ | Confirm → Telegram + Email |
| `DELETE` | `/api/:id` | ✅ | Reject/delete registration |
| `POST` | `/api/send-confirmation-email` | ❌ | Send email with PDF receipt |
| `POST` | `/api/telegram-webhook` | ❌ | Telegram bot callbacks |

</details>

<details>
<summary><b>📤 Upload & Gallery</b></summary>

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `POST` | `/api/upload` | ❌ | Upload image to Cloudinary (5MB max) |
| `GET` | `/api/gallery/:day` | ❌ | Get gallery images by day |

</details>

---

## 🗄 Database Schemas

```
Admin        → email, password (bcrypt hashed)
Event        → title, description, date, location, status, images[]
Team         → name, role, department, email, phone, photo, priority
Contact      → name, email, message, read, createdAt
Registration → eventType, teamName, teamSize, teamMembers[], payment{}, status
Counter      → name, seq
```

---

## 🌐 Deployment

| Service | Used For |
|:--------|:---------|
| **[Vercel](https://vercel.com)** | Frontend hosting (SPA with rewrites) |
| **[Render](https://render.com)** | Backend API hosting |
| **[MongoDB Atlas](https://mongodb.com/atlas)** | Cloud database |
| **[Cloudinary](https://cloudinary.com)** | Image CDN & storage |
| **[Brevo](https://brevo.com)** | Transactional emails |
| **[Telegram Bot](https://core.telegram.org/bots)** | Admin notifications |

---

## 📜 Available Scripts

| Script | Command | Description |
|:-------|:--------|:------------|
| Dev | `npm run dev` | Start Vite dev server |
| Build | `npm run build` | Production build |
| Preview | `npm run preview` | Preview production build |
| Lint | `npm run lint` | Run ESLint |
| Test | `npm run test` | Run Vitest tests |

---

## 📊 Project Stats

| Metric | Value |
|:-------|:------|
| Total custom code | **~8,200 lines** |
| Frontend components | **12 custom + 49 shadcn/ui** |
| Pages | **10** |
| API endpoints | **20+** |
| Database models | **6** |
| External integrations | **7** |

---

## 👨‍💻 Author

<div align="center">

**Chitturi Sanjay Kumar**

IEEE SPS Vice Chair · Aditya University

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sanjaykumarchitturi)
[![Email](https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:ieee.club.aus@gmail.com)

</div>

---

<div align="center">

**IEEE Signal Processing Society · Student Branch Chapter**

Aditya University, Surampalem, Andhra Pradesh

⚡ *Advancing signal processing research, fostering innovation, and building a globally connected technical community.*

</div>
