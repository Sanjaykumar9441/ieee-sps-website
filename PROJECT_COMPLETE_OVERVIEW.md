# IEEE Website – Complete Project Documentation

## 1. Project Overview
This repository is a full-stack web application for the IEEE Signal Processing Society website. It contains:
- A modern React + TypeScript frontend
- A Node.js + Express backend
- MongoDB-based data models
- Admin dashboard features
- Event registration, membership, contact, and gallery workflows
- Media uploads, email notifications, PDF generation, and export tools

## 2. Main Root Folders

### [frontend](frontend)
The frontend is the public website and admin panel UI.

Key files and folders:
- [frontend/package.json](frontend/package.json) – frontend dependencies and scripts
- [frontend/index.html](frontend/index.html) – HTML entry point
- [frontend/vite.config.ts](frontend/vite.config.ts) – Vite configuration
- [frontend/tailwind.config.ts](frontend/tailwind.config.ts) – Tailwind configuration
- [frontend/src/App.tsx](frontend/src/App.tsx) – route setup and app shell
- [frontend/src/main.tsx](frontend/src/main.tsx) – app bootstrap
- [frontend/src/index.css](frontend/src/index.css) – global styling
- [frontend/src/pages](frontend/src/pages) – page-level screens
- [frontend/src/components](frontend/src/components) – reusable page sections and UI widgets
- [frontend/src/hooks](frontend/src/hooks) – custom React hooks
- [frontend/src/lib](frontend/src/lib) – helper utilities
- [frontend/src/services](frontend/src/services) – API request logic
- [frontend/src/api](frontend/src/api) – API service layer
- [frontend/src/common](frontend/src/common) – shared frontend logic/constants
- [frontend/src/assets](frontend/src/assets) – static images/logos/icons
- [frontend/src/styles](frontend/src/styles) – design styles
- [frontend/src/test](frontend/src/test) – frontend tests
- [frontend/public](frontend/public) – public static assets

### [backend](backend)
The backend handles the server, APIs, authentication, database operations, uploads, email, and generated docs.

Key files and folders:
- [backend/package.json](backend/package.json) – backend dependencies and scripts
- [backend/server.js](backend/server.js) – backend entry point
- [backend/config](backend/config) – environment/config settings
- [backend/constants](backend/constants) – backend constants and fixed values
- [backend/controllers](backend/controllers) – request handlers/controllers
- [backend/middleware](backend/middleware) – authentication and validation middleware
- [backend/models](backend/models) – Mongoose schemas
- [backend/routes](backend/routes) – API route definitions
- [backend/services](backend/services) – business logic and integrations
- [backend/utils](backend/utils) – helper utilities and shared logic
- [backend/validators](backend/validators) – form/request validation modules
- [backend/emails](backend/emails) – email templates or email-related logic
- [backend/pdf](backend/pdf) – PDF generation resources
- [backend/uploads](backend/uploads) – upload storage
- [backend/public](backend/public) – backend public assets
- [backend/socket](backend/socket) – socket-related backend code
- [backend/createAdmin.js](backend/createAdmin.js) – admin seed/helper script
- [backend/hash.js](backend/hash.js) – password hashing helper

## 3. Frontend Detailed Structure

### Pages
Located in [frontend/src/pages](frontend/src/pages):
- [frontend/src/pages/Home.tsx](frontend/src/pages/Home.tsx)
- [frontend/src/pages/Index.tsx](frontend/src/pages/Index.tsx)
- [frontend/src/pages/AdminLogin.tsx](frontend/src/pages/AdminLogin.tsx)
- [frontend/src/pages/Dashboard.tsx](frontend/src/pages/Dashboard.tsx)
- [frontend/src/pages/Dashboard](frontend/src/pages/Dashboard)
- [frontend/src/pages/EventDetails.tsx](frontend/src/pages/EventDetails.tsx)
- [frontend/src/pages/AllEvents.tsx](frontend/src/pages/AllEvents.tsx)
- [frontend/src/pages/AllMembers.tsx](frontend/src/pages/AllMembers.tsx)
- [frontend/src/pages/TeamDetails.tsx](frontend/src/pages/TeamDetails.tsx)
- [frontend/src/pages/ArduinoDays.tsx](frontend/src/pages/ArduinoDays.tsx)
- [frontend/src/pages/JoinSPS.tsx](frontend/src/pages/JoinSPS.tsx)
- [frontend/src/pages/ChangePassword.tsx](frontend/src/pages/ChangePassword.tsx)
- [frontend/src/pages/Profile.tsx](frontend/src/pages/Profile.tsx)
- [frontend/src/pages/RegistrationSuccess.tsx](frontend/src/pages/RegistrationSuccess.tsx)
- [frontend/src/pages/MembershipDrive.tsx](frontend/src/pages/MembershipDrive.tsx)
- [frontend/src/pages/SpaceDay.tsx](frontend/src/pages/SpaceDay.tsx)
- [frontend/src/pages/SpaceDayRegistration.tsx](frontend/src/pages/SpaceDayRegistration.tsx)
- [frontend/src/pages/SpaceDayRegistrationStatus.tsx](frontend/src/pages/SpaceDayRegistrationStatus.tsx)
- [frontend/src/pages/NotFound.tsx](frontend/src/pages/NotFound.tsx)

### Main Components
Located in [frontend/src/components](frontend/src/components):
- [frontend/src/components/Navbar.tsx](frontend/src/components/Navbar.tsx)
- [frontend/src/components/HeroSection.tsx](frontend/src/components/HeroSection.tsx)
- [frontend/src/components/AboutSection.tsx](frontend/src/components/AboutSection.tsx)
- [frontend/src/components/ContactSection.tsx](frontend/src/components/ContactSection.tsx)
- [frontend/src/components/EventsSection.tsx](frontend/src/components/EventsSection.tsx)
- [frontend/src/components/TeamSection.tsx](frontend/src/components/TeamSection.tsx)
- [frontend/src/components/Footer.tsx](frontend/src/components/Footer.tsx)
- [frontend/src/components/StatsSection.tsx](frontend/src/components/StatsSection.tsx)
- [frontend/src/components/DomainsSection.tsx](frontend/src/components/DomainsSection.tsx)
- [frontend/src/components/LoadingScreen.tsx](frontend/src/components/LoadingScreen.tsx)
- [frontend/src/components/Reveal.tsx](frontend/src/components/Reveal.tsx)
- [frontend/src/components/BackToTop.tsx](frontend/src/components/BackToTop.tsx)
- [frontend/src/components/ScrollToTop.tsx](frontend/src/components/ScrollToTop.tsx)
- [frontend/src/components/NavLink.tsx](frontend/src/components/NavLink.tsx)
- [frontend/src/components/spaceDay](frontend/src/components/spaceDay)
- [frontend/src/components/ui](frontend/src/components/ui)

### Other Frontend Support Folders
- [frontend/src/hooks](frontend/src/hooks)
- [frontend/src/lib](frontend/src/lib)
- [frontend/src/utils](frontend/src/utils)
- [frontend/src/services](frontend/src/services)
- [frontend/src/common](frontend/src/common)
- [frontend/src/assets](frontend/src/assets)
- [frontend/src/styles](frontend/src/styles)
- [frontend/src/test](frontend/src/test)

## 4. Backend Detailed Structure

### Routes
Located in [backend/routes](backend/routes):
- [backend/routes/adminRoutes.js](backend/routes/adminRoutes.js)
- [backend/routes/adminAccessRoutes.js](backend/routes/adminAccessRoutes.js)
- [backend/routes/activityRoutes.js](backend/routes/activityRoutes.js)
- [backend/routes/contactRoutes.js](backend/routes/contactRoutes.js)
- [backend/routes/eventRoutes.js](backend/routes/eventRoutes.js)
- [backend/routes/galleryRoutes.js](backend/routes/galleryRoutes.js)
- [backend/routes/membershipRoutes.js](backend/routes/membershipRoutes.js)
- [backend/routes/spsApplicationRoutes.js](backend/routes/spsApplicationRoutes.js)
- [backend/routes/teamRoutes.js](backend/routes/teamRoutes.js)
- [backend/routes/telegramRoutes.js](backend/routes/telegramRoutes.js)
- [backend/routes/spaceDayRegistrationRoutes.js](backend/routes/spaceDayRegistrationRoutes.js)
- [backend/routes/spaceDayAdminRoutes.js](backend/routes/spaceDayAdminRoutes.js)
- [backend/routes/spaceDayExportRoutes.js](backend/routes/spaceDayExportRoutes.js)
- [backend/routes/arduinoRegistrationRoutes.js](backend/routes/arduinoRegistrationRoutes.js)
- [backend/routes/arduinoUploadRoutes.js](backend/routes/arduinoUploadRoutes.js)

### Controllers
Located in [backend/controllers](backend/controllers):
- Event, gallery, registration, admin, membership, and related logic handlers are present here.

### Models
Located in [backend/models](backend/models):
- [backend/models/admin.js](backend/models/admin.js)
- [backend/models/AdminAccess.js](backend/models/AdminAccess.js)
- [backend/models/ActivityLog.js](backend/models/ActivityLog.js)
- [backend/models/contact.js](backend/models/contact.js)
- [backend/models/counter.js](backend/models/counter.js)
- [backend/models/event.js](backend/models/event.js)
- [backend/models/EventSettings.js](backend/models/EventSettings.js)
- [backend/models/team.js](backend/models/team.js)
- [backend/models/registration.js](backend/models/registration.js)
- [backend/models/ArduinoRegistration.js](backend/models/ArduinoRegistration.js)
- [backend/models/MembershipRegistration.js](backend/models/MembershipRegistration.js)
- [backend/models/MembershipSettings.js](backend/models/MembershipSettings.js)
- [backend/models/SpaceDayRegistration.js](backend/models/SpaceDayRegistration.js)
- [backend/models/SpaceDayAttendanceLog.js](backend/models/SpaceDayAttendanceLog.js)
- [backend/models/SPSApplication.js](backend/models/SPSApplication.js)

### Middleware and Security
- [backend/middleware/verifyToken.js](backend/middleware/verifyToken.js)

### Utilities and Support
- [backend/utils](backend/utils)
- [backend/emails](backend/emails)
- [backend/pdf](backend/pdf)
- [backend/validators](backend/validators)
- [backend/services](backend/services)
- [backend/constants](backend/constants)
- [backend/config](backend/config)

## 5. Current Implemented Features
The codebase currently includes implementations for:
- Public website landing and content pages
- Event listing and detail pages
- Team member listing and profile details
- Admin dashboard and authentication
- Event registration workflow
- Membership drive flow
- Space Day registration and status pages
- Contact form handling
- Gallery and upload support
- Database persistence using MongoDB
- Email sending and receipt/PDF generation
- Admin access logging and activity tracking
- Real-time/notification-related backend services

## 6. Project Status Summary
This repository already contains a large amount of project code and completed application structure, including:
- Full frontend screen pages
- Reusable laid-out UI components
- Backend API route modules
- Data models for core entities
- Middleware and utilities for auth, logs, uploads, and document generation

## 7. Notes
This document is intended to give a full practical overview of what code and folders exist in the project so it is easier to understand the repository at a glance.
