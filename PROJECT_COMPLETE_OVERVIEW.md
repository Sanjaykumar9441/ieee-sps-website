# IEEE SPS Website – Complete Project Overview

## Project Summary
This project is a full-stack website for the IEEE Signal Processing Society Student Branch Chapter at Aditya University. It includes a public-facing website, admin dashboard, event registration flow, team management, contact handling, and backend APIs connected to MongoDB.

## Tech Stack
- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion
- Backend: Node.js, Express.js, MongoDB, Mongoose, JWT, Cloudinary
- Extra Features: Email integration, PDF receipts, Telegram alerts, charts, Excel export

## Completed Frontend Code
### Pages
- [src/pages/Home.tsx](src/pages/Home.tsx) – Main landing page
- [src/pages/AdminLogin.tsx](src/pages/AdminLogin.tsx) – Admin authentication page
- [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) – Admin control panel
- [src/pages/Register.tsx](src/pages/Register.tsx) – Event registration page
- [src/pages/EventDetails.tsx](src/pages/EventDetails.tsx) – Event detail page
- [src/pages/AllEvents.tsx](src/pages/AllEvents.tsx) – All events listing page
- [src/pages/AllMembers.tsx](src/pages/AllMembers.tsx) – Team members listing page
- [src/pages/TeamDetails.tsx](src/pages/TeamDetails.tsx) – Member profile page
- [src/pages/ArduinoDays.tsx](src/pages/ArduinoDays.tsx) – Special event page
- [src/pages/ChangePassword.tsx](src/pages/ChangePassword.tsx) – Password change page
- [src/pages/JoinSPS.tsx](src/pages/JoinSPS.tsx) – Join SPS page
- [src/pages/NotFound.tsx](src/pages/NotFound.tsx) – 404 page

### Reusable Components
- [src/components/Navbar.tsx](src/components/Navbar.tsx) – Navigation bar
- [src/components/HeroSection.tsx](src/components/HeroSection.tsx) – Hero section
- [src/components/AboutSection.tsx](src/components/AboutSection.tsx) – About section
- [src/components/StatsSection.tsx](src/components/StatsSection.tsx) – Stats section
- [src/components/EventsSection.tsx](src/components/EventsSection.tsx) – Events display
- [src/components/TeamSection.tsx](src/components/TeamSection.tsx) – Team display
- [src/components/ContactSection.tsx](src/components/ContactSection.tsx) – Contact form
- [src/components/Footer.tsx](src/components/Footer.tsx) – Footer section
- [src/components/LoadingScreen.tsx](src/components/LoadingScreen.tsx) – Loading animation
- [src/components/BackToTop.tsx](src/components/BackToTop.tsx) – Back-to-top button
- [src/components/Reveal.tsx](src/components/Reveal.tsx) – Animation wrapper
- [src/components/ScrollToTop.tsx](src/components/ScrollToTop.tsx) – Scroll restore helper

### UI Library Components
The project also includes many reusable UI components under [src/components/ui](src/components/ui), such as:
- button
- card
- dialog
- dropdown-menu
- form
- input
- table
- tabs
- toast
- etc.

## Completed Backend Code
### Server and Routing
- [backend/server.js](backend/server.js) – Main backend server entry point
- [backend/routes/adminRoutes.js](backend/routes/adminRoutes.js) – Admin API routes
- [backend/routes/eventRoutes.js](backend/routes/eventRoutes.js) – Event API routes
- [backend/routes/teamRoutes.js](backend/routes/teamRoutes.js) – Team API routes
- [backend/routes/contactRoutes.js](backend/routes/contactRoutes.js) – Contact API routes
- [backend/routes/registrationRoutes.js](backend/routes/registrationRoutes.js) – Registration flow routes
- [backend/routes/galleryRoutes.js](backend/routes/galleryRoutes.js) – Gallery routes
- [backend/routes/uploadRoutes.js](backend/routes/uploadRoutes.js) – File upload routes
- [backend/routes/adminAccessRoutes.js](backend/routes/adminAccessRoutes.js) – Admin access management routes
- [backend/routes/activityRoutes.js](backend/routes/activityRoutes.js) – Activity log routes

### Models
- [backend/models/admin.js](backend/models/admin.js) – Admin schema
- [backend/models/event.js](backend/models/event.js) – Event schema
- [backend/models/team.js](backend/models/team.js) – Team member schema
- [backend/models/contact.js](backend/models/contact.js) – Contact form schema
- [backend/models/registration.js](backend/models/registration.js) – Registration schema
- [backend/models/counter.js](backend/models/counter.js) – Auto ID counter schema
- [backend/models/SPSApplication.js](backend/models/SPSApplication.js) – SPS application schema
- [backend/models/ActivityLog.js](backend/models/ActivityLog.js) – Activity log schema
- [backend/models/AdminAccess.js](backend/models/AdminAccess.js) – Admin access log schema

### Middleware and Utilities
- [backend/middleware/verifyToken.js](backend/middleware/verifyToken.js) – JWT authentication middleware
- [backend/utils/mailer.js](backend/utils/mailer.js) – Email sending utility
- [backend/utils/receiptTemplate.js](backend/utils/receiptTemplate.js) – PDF/receipt email template
- [backend/utils/logActivity.js](backend/utils/logActivity.js) – Activity logging utility
- [backend/config/cloudinary.js](backend/config/cloudinary.js) – Cloudinary configuration

## Completed Features
- Public website with modern UI and animations
- Admin login and dashboard
- Event creation, editing, and deletion
- Team member management
- Contact form and message handling
- Event registration system
- Payment screenshot verification flow
- Accommodation option in registration
- Cloudinary-based image upload
- Email confirmation and receipt generation
- Admin activity logging
- Dashboard analytics and charts
- Excel export for registrations
- PDF receipt generation
- Responsive design for mobile and desktop

## Current Code Status
The project already contains a large amount of completed frontend and backend code, including:
- Full React + TypeScript frontend structure
- Multiple completed pages and reusable components
- Fully organized backend API modules
- Database models and authentication flow
- Integration utilities for media, email, and reporting

## Notes
This file is meant to give a clear overview of the implemented codebase and the completed modules currently available in the project.
