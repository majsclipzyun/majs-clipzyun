# Maj's ClipZyun — Cinematic Portfolio & Booking Web App

A responsive portfolio site with a project-enquiry form, SQLite storage, and a password-protected admin dashboard.

## Requirements
- Node.js 20 or newer
- npm

## Run locally
1. Extract the project ZIP and open a terminal in the project directory.
2. Install packages:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and change `SESSION_SECRET` and `ADMIN_PASSWORD`.
4. Start the app:
   ```bash
   npm start
   ```
5. Open `http://localhost:3000` for the portfolio, and `http://localhost:3000/admin` for the dashboard.

The database (`studio.sqlite`) and session database (`sessions.sqlite`) are created automatically.

## Features included
- Modern, responsive cinematic portfolio and service pages
- Booking enquiry form with server-side validation and rate limiting
- SQLite database for incoming enquiries
- Admin sign-in, overview counts, booking list, and status changes
- Mobile navigation, scroll reveals, reduced-motion support
- Basic security headers and HTTP-only session cookie

## Before launching publicly
- Set a strong, unique `SESSION_SECRET` and `ADMIN_PASSWORD` in environment variables.
- Deploy behind HTTPS with `NODE_ENV=production`.
- Use a persistent disk for SQLite and backups; this starter is intended for a single app instance.
- Replace sample stock photography with your own portfolio images/videos and update About/contact details.
- Add a real contact email/WhatsApp link, privacy policy, and terms appropriate to your business.
- Payment collection, email notifications, password reset, multi-user roles, and cloud video hosting are not included yet.
- Google Fonts and the sample Unsplash images need internet access. Replace with locally hosted assets for fully self-hosted delivery.

## Notes
This is a working starter project, not a hosted public website. It needs to be run locally or deployed to a server before clients can access it online.
