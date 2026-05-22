# 🌐 IEEE SPS Website — Complete Project Overview

> **IEEE Signal Processing Society (SPS) Student Branch Chapter — Aditya University**
> Developed by **Sanjay Kumar** (IEEE SPS Vice Chair)

---

## 📋 Project Summary

A full-stack web application for the IEEE SPS Student Branch Chapter at Aditya University. The platform manages **events**, **team members**, **contact messages**, **event registrations** (Arduino Days 2026), and an **admin dashboard** — all with a premium, animated UI.

| Item | Detail |
|------|--------|
| **Live URL** | [ieeespsaditya.vercel.app](https://ieeespsaditya.vercel.app) |
| **Backend URL** | `https://ieee-sps-website.onrender.com` |
| **Frontend Hosting** | Vercel |
| **Backend Hosting** | Render |

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type safety |
| **Vite 5** | Build tool & dev server |
| **Tailwind CSS 3** | Utility-first styling |
| **Framer Motion** | Animations & transitions |
| **React Router DOM 6** | Client-side routing |
| **Axios** | HTTP requests |
| **Lucide React** | Icon library |
| **shadcn/ui (Radix UI)** | 49 pre-built UI components |
| **React TSParticles** | Particle background effects |
| **Recharts** | Charts in dashboard |
| **Sonner** | Toast notifications |
| **Zod** | Form validation |
| **React Hook Form** | Form management |
| **canvas-confetti** | Confetti effects |
| **jsPDF / xlsx / file-saver** | PDF/Excel export |

### Backend

| Technology | Purpose |
|-----------|---------|
| **Node.js + Express 5** | REST API server |
| **MongoDB + Mongoose 9** | Database & ODM |
| **JWT (jsonwebtoken)** | Authentication |
| **bcryptjs** | Password hashing |
| **Cloudinary + Multer** | Image upload & storage |
| **Brevo (Sendinblue)** | Transactional emails |
| **PDFKit** | Receipt PDF generation |
| **QRCode** | QR code generation |
| **Telegram Bot API** | Registration notifications |
| **express-rate-limit** | API rate limiting |
| **compression** | Response compression |

---

## 📁 Complete Project Structure

```
IEEE Website/
├── 📄 index.html                  # HTML entry point
├── 📄 package.json                # Frontend dependencies (76 deps)
├── 📄 vite.config.ts              # Vite config with React SWC plugin
├── 📄 tailwind.config.ts          # Tailwind config with custom animations
├── 📄 tsconfig.json               # TypeScript config
├── 📄 vercel.json                 # Vercel deployment (rewrites for SPA)
├── 📄 components.json             # shadcn/ui config
│
├── 📂 public/                     # Static assets
│   ├── AD2026.png                 # Arduino Days logo
│   ├── titlelogo.png              # Title logo
│   ├── logo1.png, logo2.png, logo3.png
│   ├── OIP.png, arkance.jpg
│   ├── map.png                    # Venue map
│   ├── fallback.png               # Fallback image
│   ├── beep.mp3                   # Audio file
│   ├── freepik_arduino_background.webp
│   └── Arduinodays2026-IDEA-Presentation-Format.pptx
│
├── 📂 src/
│   ├── 📄 main.tsx                # React entry point
│   ├── 📄 App.tsx                 # Root component with routing
│   ├── 📄 App.css                 # App-level styles
│   ├── 📄 index.css               # Global styles & Tailwind imports
│   │
│   ├── 📂 components/             # 12 custom components
│   │   ├── Navbar.tsx             # 231 lines — Glassmorphism nav with scroll spy
│   │   ├── NavLink.tsx            # Navigation link helper
│   │   ├── HeroSection.tsx        # 143 lines — Full-screen hero with font cycling
│   │   ├── AboutSection.tsx       # 157 lines — Mission/Vision + highlights
│   │   ├── StatsSection.tsx       # 56 lines — Chapter impact stats
│   │   ├── EventsSection.tsx      # 178 lines — Events list from API
│   │   ├── TeamSection.tsx        # 148 lines — Team grid from API
│   │   ├── ContactSection.tsx     # 147 lines — Contact form
│   │   ├── Footer.tsx             # 179 lines — Social links + neon animations
│   │   ├── LoadingScreen.tsx      # 320 lines — Cyberpunk loading animation
│   │   ├── ThemeToggle.tsx        # 55 lines — Dark/Light mode toggle
│   │   ├── Reveal.tsx             # Scroll reveal animation wrapper
│   │   └── 📂 ui/                 # 49 shadcn/ui components
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── alert.tsx
│   │       ├── aspect-ratio.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── breadcrumb.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── carousel.tsx
│   │       ├── chart.tsx
│   │       ├── checkbox.tsx
│   │       ├── collapsible.tsx
│   │       ├── command.tsx
│   │       ├── context-menu.tsx
│   │       ├── dialog.tsx
│   │       ├── drawer.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── hover-card.tsx
│   │       ├── input-otp.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── menubar.tsx
│   │       ├── navigation-menu.tsx
│   │       ├── pagination.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── resizable.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── slider.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       ├── toggle-group.tsx
│   │       ├── toggle.tsx
│   │       ├── tooltip.tsx
│   │       └── use-toast.ts
│   │
│   ├── 📂 pages/                  # 10 page components
│   │   ├── Index.tsx              # Index redirect
│   │   ├── Home.tsx               # 26 lines — Composes all landing sections
│   │   ├── AdminLogin.tsx         # 219 lines — Admin login page
│   │   ├── Dashboard.tsx          # ~75KB — Full admin control panel
│   │   ├── AllEvents.tsx          # 63 lines — All events listing
│   │   ├── EventDetails.tsx       # 136 lines — Single event + gallery
│   │   ├── ArduinoDays.tsx        # ~46KB — Dedicated Arduino Days page
│   │   ├── Register.tsx           # ~71KB — Multi-step registration form
│   │   ├── TeamDetails.tsx        # 90 lines — Team member profile
│   │   └── NotFound.tsx           # 25 lines — 404 page
│   │
│   ├── 📂 hooks/                  # 3 custom hooks
│   │   ├── use-mobile.tsx         # Mobile screen detection
│   │   ├── use-toast.ts           # Toast notification hook
│   │   └── useLoader.ts           # Loading state hook
│   │
│   ├── 📂 lib/
│   │   └── utils.ts               # cn() utility (clsx + tailwind-merge)
│   │
│   ├── 📂 assets/                 # Local asset imports (logos)
│   └── 📂 test/
│       ├── setup.ts               # Vitest setup
│       └── example.test.ts        # Example test
│
└── 📂 backend/
    ├── 📄 server.js               # 165 lines — Express server entry point
    ├── 📄 package.json            # Backend dependencies (15 deps)
    ├── 📄 .env                    # Environment variables (9 vars)
    ├── 📄 createAdmin.js          # Admin seeder script
    ├── 📄 hash.js                 # Password hash utility
    │
    ├── 📂 config/
    │   └── cloudinary.js          # Cloudinary configuration
    │
    ├── 📂 middleware/
    │   └── verifyToken.js         # JWT authentication middleware
    │
    ├── 📂 models/                 # 6 Mongoose models
    │   ├── admin.js               # Admin schema (email, password)
    │   ├── contact.js             # Contact schema (name, email, message, read)
    │   ├── counter.js             # Counter schema (name, seq)
    │   ├── event.js               # Event schema (title, description, date, location, status, images)
    │   ├── registration.js        # Registration schema (team, members, payment, status)
    │   └── team.js                # Team schema (name, role, department, photo, priority)
    │
    ├── 📂 routes/                 # 7 route modules
    │   ├── adminRoutes.js         # 64 lines — Login endpoint
    │   ├── contactRoutes.js       # 37 lines — Contact CRUD
    │   ├── eventRoutes.js         # 158 lines — Events CRUD + image upload
    │   ├── teamRoutes.js          # 136 lines — Team CRUD + photo upload
    │   ├── registrationRoutes.js  # 924 lines — Registration flow + Telegram + Email
    │   ├── uploadRoutes.js        # 47 lines — Image upload to Cloudinary
    │   └── galleryRoutes.js       # 8 lines — Gallery from Cloudinary
    │
    ├── 📂 controllers/
    │   └── galleryController.js   # 31 lines — Cloudinary gallery search
    │
    ├── 📂 utils/
    │   ├── mailer.js              # 55 lines — Brevo transactional email sender
    │   └── receiptTemplate.js     # 88 lines — HTML email receipt template
    │
    └── 📂 uploads/                # Local upload directory (runtime)
```

---

## 🗺 Frontend Routes

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/` | `Home.tsx` | Main landing page with all sections |
| `/admin-login` | `AdminLogin.tsx` | Admin authentication page |
| `/dashboard` | `Dashboard.tsx` | Full admin control panel |
| `/event/:id` | `EventDetails.tsx` | Single event detail + gallery |
| `/all-events` | `AllEvents.tsx` | List all events |
| `/team/:id` | `TeamDetails.tsx` | Team member profile |
| `/arduino-days` | `ArduinoDays.tsx` | Dedicated Arduino Days 2026 page |
| `/register` | `Register.tsx` | Multi-step event registration |

---

## 🧩 Component-by-Component Breakdown

### Landing Page Components

#### `Navbar.tsx` — 231 lines
- **Desktop**: Glassmorphism floating nav (top-right), pill-shaped links with active highlighting
- **Mobile**: Hamburger menu with centered overlay panel
- **Features**: Smooth scroll to sections, IntersectionObserver for active state, logos for IEEE/SPS/University, admin button with loading transition, dark/light mode toggle
- **API**: None (navigation only)

#### `HeroSection.tsx` — 143 lines
- Full-screen hero with animated gradient background
- Floating glow blobs (cyan/blue, `animate-pulse`)
- **Font cycling**: Title "Student Branch Chapter" cycles through 10 fonts (Orbitron, Audiowide, Bebas Neue, Cinzel, Playfair Display, Oswald, Righteous, Anton, Exo 2, Rajdhani) on scroll
- CTA button links to Microsoft Forms for IEEE SPS membership
- Glassmorphism badge: "IEEE Signal Processing Society"

#### `AboutSection.tsx` — 157 lines
- **Mission & Vision** cards with RGB animated borders (`animate-rgb-border`)
- 4 highlight cards: Signal Processing, Machine Learning, Community, Competitions
- Uses `BorderCard` wrapper with spring hover animation (`whileHover: y:-6, scale:1.02`)
- Framer Motion scroll-triggered animations

#### `StatsSection.tsx` — 56 lines
- "Chapter Impact" display with 4 stats:
  - 20+ Active Members
  - 1 Technical Event
  - 1 Workshop Conducted
  - 1 Research Initiative
- Each stat has hover scale animation

#### `EventsSection.tsx` — 178 lines
- Fetches events from `GET https://ieee-sps-website.onrender.com/events`
- Shows latest 4 events as glass cards
- Each card: status badge (Upcoming/Completed), title, date, location, "View Details" button
- Special routing: "Arduino Days 2026" → `/arduino-days`, others → `/event/:id`
- Glow-on-hover gradient effect

#### `TeamSection.tsx` — 148 lines
- Fetches team members from `GET https://ieee-sps-website.onrender.com/team` (sorted by priority)
- Responsive grid: 2 cols (mobile) → 4 cols (desktop)
- Show/hide toggle: 4 initially on mobile, 8 on desktop
- Member cards: circular photo, name, role, "View Details" button

#### `ContactSection.tsx` — 147 lines
- Contact form with name, email, message fields
- Posts to `POST ${VITE_API_URL}/contact`
- Client-side email validation with regex
- Success/error states with animated feedback
- RGB animated border wrapper

#### `Footer.tsx` — 179 lines
- Organization name with RGB animated text
- Social links: Email, LinkedIn, Instagram, Facebook, Twitter/X
- Each icon has neon glow animation (`neonIconGlow` keyframes cycling cyan ↔ blue)
- Contact info: +91 70950 09441, ieee.club.aus@gmail.com
- Credits: "Created by Sanjay Kumar" with LinkedIn link

#### `LoadingScreen.tsx` — 320 lines
- **Premium cyberpunk loading screen** with:
  - Scanline texture overlay (30 horizontal lines)
  - Neon grid background (60px grid)
  - 3 ambient glow blobs (pink, green, purple) with pulsing animations
  - 5 glitch lines (animated horizontal lines)
  - "IEEE SPS" logo with corner brackets, neon text shadows, glitch duplicate effect
  - Progress bar: gradient fill (purple → cyan → green) + leading edge glow
  - Orbitron font, 3-second duration
  - Smooth exit animation (opacity fade)
  - Uses `requestAnimationFrame` for smooth 0-100% progress

#### `ThemeToggle.tsx` — 55 lines
- Dark/light mode toggle using `localStorage`
- Default: Dark mode
- Sun/Moon icons from Lucide
- Adds/removes `dark` class on `<html>` element

#### `Reveal.tsx` — Scroll reveal animation wrapper component

---

## 📄 Page-by-Page Breakdown

### `Home.tsx` — 26 lines
Composes all landing page sections in order:
```
Navbar → HeroSection → StatsSection → AboutSection → EventsSection → TeamSection → ContactSection → Footer
```

---

### `AdminLogin.tsx` — 219 lines
- Dark theme login page (`#080c14` background)
- Animated background mesh: glow blobs + grid overlay
- Form fields: email + password with custom focus/blur glow styling
- IEEE SPS branded header with Zap icon
- Posts to `POST https://ieee-sps-website.onrender.com/admin/login`
- On success: stores JWT in `localStorage`, redirects to `/dashboard`
- Loading spinner during authentication
- Enter key support for login

---

### `Dashboard.tsx` — ~75KB (largest file)
The admin control panel with multiple management tabs:

| Tab | Features |
|-----|----------|
| **Events** | Create/edit/delete events, upload images to Cloudinary, set status (Upcoming/Completed) |
| **Team** | Add/edit/delete members with photo upload, set role/department/priority |
| **Contacts** | View/delete contact messages, read/unread status tracking |
| **Registrations** | View all Arduino Days registrations, confirm/reject with Telegram notification, export to Excel, generate PDF receipts |
| **Gallery** | View event gallery from Cloudinary by day |

- JWT token sent in `Authorization: Bearer` header for all protected calls
- Uses Recharts for stats visualization
- Excel export via `xlsx` library
- PDF receipt generation via `jsPDF`

---

### `ArduinoDays.tsx` — ~46KB
Dedicated page for the **Arduino Days 2026** event with:
- Event schedule & timeline
- Venue map with Google Maps link
- Speaker/sponsor information
- Registration link to `/register`
- Photo gallery (fetched from Cloudinary via `GET /api/gallery/:day`)
- Downloadable PPTX presentation template

---

### `Register.tsx` — ~71KB
Multi-step registration form for Arduino Days with 6 steps:

| Step | Content |
|------|---------|
| 1 | Event type selection: **Combo** (Workshop + Buildathon @ ₹200/person) or **Buildathon Only** (@ ₹100/person) |
| 2 | Team name + team size selection |
| 3 | Team member details: full name, roll no, email, phone, department, year, college, city, pincode, district, state |
| 4 | Accommodation details: optional hostel booking with arrival/departure dates & times |
| 5 | Payment via UPI: QR code display, screenshot upload to Cloudinary, 12-digit UTR validation |
| 6 | Review all details & submit |

**Validation Rules:**
- Duplicate team name check via `GET /api/check-team`
- UTR must be exactly 12 digits
- Repeated digit UTR rejected (e.g., 111111111111)
- Duplicate UTR across registrations rejected
- Duplicate members (by email, phone, or roll no) rejected
- Anti-spam honeypot field
- Rate limited: max 15 registrations per IP per 10 minutes

**API Calls:**
- `POST /api/upload` — upload payment screenshot to Cloudinary
- `POST /api/register` — submit full registration

---

### `EventDetails.tsx` — 136 lines
- Fetches single event by ID from `GET /events/:id`
- TSParticles background (cyan linked particles, 60 particles, speed 1)
- Displays: title, status badge, date, location, description in glass card
- Image gallery grid (2-3 cols) with gradient border + hover zoom effect

### `TeamDetails.tsx` — 90 lines
- Fetches member by ID from `GET /team/:id`
- Glass card with circular avatar (glowing primary-color border)
- Info rows with border separator: Department, Roll Number, Registration Number, Email

### `NotFound.tsx` — 25 lines
- Simple 404 page with "Return to Home" link
- Logs attempted path to console for debugging

---

## 🗄 Database Models (MongoDB)

### Admin Model (`backend/models/admin.js`)
```javascript
{
  email    : String   // required, unique
  password : String   // required, bcrypt hashed
}
```

### Event Model (`backend/models/event.js`)
```javascript
{
  title       : String    // required
  description : String
  date        : String
  location    : String
  status      : String    // enum: ["Upcoming", "Completed"], default: "Upcoming"
  images      : [String]  // Cloudinary URLs
  // timestamps: true → createdAt, updatedAt
}
```

### Team Model (`backend/models/team.js`)
```javascript
{
  name               : String   // required
  role               : String   // required — Chair, Vice Chair, Secretary, etc.
  department         : String
  rollNumber         : String
  registrationNumber : String
  email              : String
  phone              : String
  photo              : String   // Cloudinary URL
  priority           : Number   // default: 5 — lower = displayed first
  // timestamps: true
}
```

### Contact Model (`backend/models/contact.js`)
```javascript
{
  name      : String    // required
  email     : String    // required
  message   : String    // required
  read      : Boolean   // default: false
  createdAt : Date      // default: Date.now
}
```

### Registration Model (`backend/models/registration.js`)
```javascript
{
  eventType       : String    // enum: ["combo", "buildathon"], default: "combo"
  eventName       : String    // required
  registrationId  : String    // required, unique — auto-generated: SPS26CMB-XXXX or SPS26BLD-XXXX
  teamName        : String    // required, stored as UPPERCASE
  teamSize        : Number    // required
  teamMembers     : [{        // Array of member sub-documents
    fullName        : String,
    rollNo          : String,
    email           : String,
    phone           : String,
    department      : String,
    year            : String,
    college         : String,
    collegeCity     : String,
    collegePincode  : String,
    collegeDistrict : String,
    collegeState    : String
  }]
  expectedAmount        : Number
  accommodationRequired : Boolean   // default: false
  hostelMembers         : [MemberSchema]
  arrivalDate           : String
  arrivalTime           : String
  departureDate         : String
  departureTime         : String
  payment : {
    userTransactionId : String    // required, 12-digit UPI UTR
    screenshotUrl     : String    // required, Cloudinary URL
    verified          : Boolean   // default: false
  }
  telegramMessageId     : Number
  registrationStatus    : String   // enum: ["Pending", "Confirmed", "Rejected"], default: "Pending"
  // timestamps: true
}
```

### Counter Model (`backend/models/counter.js`)
```javascript
{
  name : String
  seq  : Number
}
```

---

## 🔌 Backend API Endpoints

### Server Configuration (`backend/server.js` — 165 lines)
- Runs on `PORT` from `.env`
- CORS allowed origins: `localhost:5173` + `ieeespsaditya.vercel.app`
- Auto-creates default admin (`admin@ieee.com` / `admin123`) on startup
- Compression enabled
- 10MB request body limit
- Trust proxy enabled (for Render deployment)

### Health & Utility Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ❌ | Returns "Backend is running 🚀" |
| GET | `/health` | ❌ | Returns `{ status: "Server Running" }` |
| GET | `/ping` | ❌ | Returns "pong" |
| GET | `/test-events` | ❌ | Returns `{ message: "Events route working" }` |

---

### Admin Routes — `/admin` (`backend/routes/adminRoutes.js` — 64 lines)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/admin/login` | ❌ | Validates email/password, compares bcrypt hash, returns JWT token (1 day expiry) |

---

### Event Routes — `/events` (`backend/routes/eventRoutes.js` — 158 lines)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/events` | ❌ | Get all events (sorted by newest first) |
| GET | `/events/:id` | ❌ | Get single event by ID |
| POST | `/events` | ✅ JWT | Create event with up to 5 images uploaded to Cloudinary folder `ieee-sps-events` |
| PUT | `/events/:id` | ✅ JWT | Update event fields, appends new images (up to 10) |
| DELETE | `/events/:id` | ✅ JWT | Delete event by ID |

---

### Team Routes — `/team` (`backend/routes/teamRoutes.js` — 136 lines)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/team` | ❌ | Get all members (sorted by priority ascending) |
| GET | `/team/:id` | ❌ | Get single member by ID |
| POST | `/team` | ✅ JWT | Add member with photo uploaded to Cloudinary folder `ieee-sps-team` |
| PUT | `/team/:id` | ✅ JWT | Update member info + optional new photo |
| DELETE | `/team/:id` | ✅ JWT | Delete member by ID |

---

### Contact Routes — `/contact` (`backend/routes/contactRoutes.js` — 37 lines)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/contact` | ❌ | Submit a contact message (name, email, message) |
| GET | `/contact` | ✅ JWT | Get all messages sorted by newest first |
| DELETE | `/contact/:id` | ✅ JWT | Delete a message by ID |

---

### Registration Routes — `/api` (`backend/routes/registrationRoutes.js` — 924 lines)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/registrations` | ✅ JWT | Get all registrations (sorted by newest) |
| GET | `/api/check-team?teamName=X` | ❌ | Check if team name already exists |
| POST | `/api/register` | ❌ (rate-limited: 15/10min) | Create registration with full validation chain |
| PUT | `/api/confirm/:id` | ✅ JWT | Confirm registration → updates Telegram message → sends confirmation email |
| DELETE | `/api/:id` | ✅ JWT | Reject/delete registration → updates Telegram message |
| POST | `/api/send-confirmation-email` | ❌ | Sends confirmation email with PDF receipt to all team members |
| POST | `/api/telegram-webhook` | ❌ | Handles Telegram bot callbacks (confirm/reject buttons) + `/stats` command |

**Registration Validation Chain (POST /api/register):**
1. Honeypot spam check
2. Event type validation
3. Registration open check
4. Team size matches members count
5. Backend amount recalculation (₹200 × size for combo, ₹100 × size for buildathon)
6. Frontend amount must match backend calculation
7. UTR must be exactly 12 digits
8. UTR cannot be all same digits
9. Payment screenshot required
10. Duplicate UTR check
11. Duplicate team name check
12. Duplicate member check (email, phone, roll no)
13. Generate unique registration ID (SPS26CMB-XXXX or SPS26BLD-XXXX)

**After Successful Registration:**
- Save to MongoDB
- Send Telegram notification with payment screenshot + Confirm/Reject inline buttons
- Save Telegram message ID for later updates

**Confirmation Flow:**
- Admin confirms → status set to "Confirmed"
- Telegram message updated to show "✅ Confirmed"
- Confirmation email sent to all team members via Brevo
- PDF receipt attached (generated by PDFKit with logo, team details, payment info, status)

**Email Templates:**
- **Combo Event**: Includes Skill Forze Workshop + Buildathon details, WhatsApp group link, important instructions
- **Buildathon Only**: Includes Buildathon-specific details, rules, separate WhatsApp group link

---

### Upload Routes — `/api/upload` (`backend/routes/uploadRoutes.js` — 47 lines)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/upload` | ❌ | Upload single image to Cloudinary `registrations` folder (5MB max, JPG/PNG only), returns `{ url }` |

---

### Gallery Routes — `/api` (`backend/routes/galleryRoutes.js` — 8 lines)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/gallery/:day` | ❌ | Search Cloudinary folder `gallery/{day}`, returns thumbnail (600w) + full (2400w) URLs |

---

## 🔐 Authentication Flow

```
1. Admin enters email + password on /admin-login
2. Frontend sends POST /admin/login { email, password }
3. Backend finds admin by email in MongoDB
4. Backend compares password using bcrypt.compare()
5. Backend signs JWT: jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '1d' })
6. Backend returns { success: true, token: "..." }
7. Frontend stores token in localStorage
8. Frontend redirects to /dashboard
9. All protected API calls include header: Authorization: Bearer <token>
10. Backend middleware verifyToken.js decodes and validates JWT on each request
```

---

## 🔑 Environment Variables (Backend `.env`)

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `PORT` | Server port number |
| `JWT_SECRET` | Secret key for JWT signing |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `BREVO_API_KEY` | Brevo (Sendinblue) API key for transactional emails |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for admin notifications |
| `TELEGRAM_CHAT_ID` | Telegram chat ID for admin group |

---

## 🎨 Design System & Visual Features

| Feature | Implementation |
|---------|---------------|
| **Dark/Light Mode** | `ThemeToggle.tsx` — toggles `dark` class on `<html>`, persisted in localStorage, default is dark |
| **Glassmorphism** | `backdrop-blur-xl dark:bg-white/5 bg-white/70 border border-white/20` on cards & navbar |
| **Neon Glow Effects** | Custom CSS keyframes: `neonBorderShift`, `neonIconGlow` cycling cyan ↔ blue |
| **RGB Animated Borders** | `animate-rgb-border` class for cycling gradient borders around cards |
| **Floating Blobs** | Blurred gradient circles with `animate-pulse` and `animate-floatSlow` |
| **Scroll-triggered Animations** | Framer Motion `whileInView` with `initial/animate` on all sections |
| **Loading Screen** | Cyberpunk-themed with scanlines, glitch effects, neon progress bar (3s) |
| **Font Cycling** | Hero subtitle cycles through 10 Google Fonts on scroll (debounced 500ms) |
| **Particle Backgrounds** | TSParticles on event detail pages (60 cyan particles with links) |
| **Spring Hover Effects** | `whileHover: { y: -6, scale: 1.02 }` with spring stiffness 250 |
| **Gradient CTA Buttons** | `bg-gradient-to-r from-cyan-500 to-blue-600` with glow shadow |

---

## 📊 UI Component Library (shadcn/ui — 49 components)

Located in `src/components/ui/`:

**Layout & Navigation:** accordion, breadcrumb, carousel, collapsible, navigation-menu, menubar, pagination, resizable, scroll-area, separator, sidebar (23KB), tabs

**Forms & Inputs:** button, calendar, checkbox, form, input, input-otp, label, radio-group, select, slider, switch, textarea

**Overlays & Feedback:** alert, alert-dialog, dialog, drawer, dropdown-menu, context-menu, hover-card, popover, sheet, toast, toaster, sonner, tooltip

**Data Display:** aspect-ratio, avatar, badge, card, chart (10KB), command, progress, skeleton, table, toggle, toggle-group

---

## 🚀 Deployment Configuration

### Frontend (Vercel)
**`vercel.json`:**
- SPA rewrite: All routes `/(*)` → `/` (for React Router client-side routing)
- Redirect: `/arduino-days⁠` (with invisible Unicode char) → `/arduino-days` (permanent)

### Backend (Render)
- Auto-deploys from Git repository
- MongoDB Atlas for cloud database
- Cloudinary for media storage and CDN
- Brevo (Sendinblue) for transactional emails

---

## 🔗 External Integrations

| Service | Usage |
|---------|-------|
| **MongoDB Atlas** | Cloud NoSQL database for all data |
| **Cloudinary** | Image upload, storage, CDN, and transformation (events, team photos, payment screenshots, gallery with auto-resize) |
| **Brevo (Sendinblue)** | Transactional confirmation emails with PDF receipt attachments |
| **Telegram Bot API** | Real-time admin notifications with inline Confirm/Reject buttons + `/stats` command for live statistics |
| **Microsoft Forms** | IEEE SPS membership applications (external link) |
| **WhatsApp Groups** | Event participant communication (links in confirmation emails) |
| **Google Maps** | Venue location link for Aditya University, Surampalem |

---

## 📈 Project Statistics

| Category | Count | Largest File |
|----------|-------|-------------|
| **Custom Components** | 12 files | `LoadingScreen.tsx` (13KB, 320 lines) |
| **Pages** | 10 files | `Dashboard.tsx` (~75KB) |
| **UI Components** | 49 files | `sidebar.tsx` (23KB) |
| **Backend Routes** | 7 files | `registrationRoutes.js` (29KB, 924 lines) |
| **Backend Models** | 6 files | `registration.js` (1.8KB, 92 lines) |
| **Utils** | 2 files | `receiptTemplate.js` (4.4KB, 88 lines) |

### Total Custom Code Lines (approximately)

| Area | ~Lines |
|------|--------|
| Frontend Components | ~1,900 |
| Frontend Pages | ~4,500 |
| Backend Server + Routes | ~1,500 |
| Backend Models + Utils | ~300 |
| **Total** | **~8,200 lines** |

---

## 🏃 How to Run Locally

### Frontend
```bash
cd "IEEE Website"
npm install
npm run dev
# → Opens at http://localhost:5173
```

### Backend
```bash
cd "IEEE Website/backend"
npm install
# Create .env file with all 9 variables
node server.js
# → Runs at http://localhost:<PORT>
```

### Available Scripts (Frontend)
| Script | Command | Description |
|--------|---------|-------------|
| Dev | `npm run dev` | Start Vite dev server |
| Build | `npm run build` | Production build |
| Build Dev | `npm run build:dev` | Development mode build |
| Preview | `npm run preview` | Preview production build |
| Lint | `npm run lint` | Run ESLint |
| Test | `npm run test` | Run Vitest tests |
| Test Watch | `npm run test:watch` | Run Vitest in watch mode |

---

> **Note:** The three largest files — `Dashboard.tsx` (75KB), `Register.tsx` (71KB), and `ArduinoDays.tsx` (46KB) — contain the core business logic. These could benefit from being split into smaller sub-components for better maintainability.

---

*Generated on 21 May 2026*
*IEEE SPS Student Branch Chapter — Aditya University, Surampalem*
