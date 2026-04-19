# KeyOne

KeyOne is a minimal, privacy-focused messaging application designed to keep communication simple, readable, and controlled. The application prioritizes clarity in both user experience and system design, avoiding unnecessary complexity in interface and interaction.

---

## Live Application

https://keyone-iota.vercel.app/

---

## Overview

KeyOne is built as a lightweight messaging platform with a focus on:

* Clear and structured communication
* Minimal interface design
* Privacy-conscious architecture
* Consistent user experience across devices

The goal is to provide a usable and focused environment without visual noise or unnecessary features.

---

## Features

### Authentication

* Google OAuth-based authentication
* Secure session handling via Supabase

### Messaging

* Send messages to selected users
* Multiple message modes:

  * View once
  * Timed expiration
  * Persistent messages

### Inbox

* View received messages
* Clean and readable message list
* Realtime updates using Supabase

### Friends System

* Add and manage connections
* Send and accept friend requests

### Search

* Search for users by identifier
* Control discoverability through settings

### Settings

* Toggle profile visibility
* Export private key
* Regenerate key pair
* Delete account and associated data

---

## Tech Stack

**Frontend**

* React / Next.js
* Custom CSS / Tailwind CSS

**Backend**

* Supabase

  * Authentication
  * PostgreSQL database
  * Realtime subscriptions

**Deployment**

* Vercel

---

## Design Approach

The interface follows a strict minimal design system:

* Black and white color scheme
* No gradients, shadows, or decorative effects
* Structured layout with consistent spacing
* Focus on readability and interaction clarity

The design is intentionally restrained to avoid distractions and ensure usability.

---

## Responsiveness

The application is designed to work across screen sizes:

* Desktop: sidebar + main content layout
* Mobile: top navigation and simplified layout
* Consistent spacing and hierarchy across devices

---

## Local Development

Clone the repository:

```bash
git clone https://github.com/your-username/keyone.git
cd keyone
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

---

## Environment Configuration

Create a `.env.local` file and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Ensure that Supabase authentication and database policies are correctly configured.

---

## Notes

* Do not expose environment variables publicly
* Configure row-level security (RLS) properly in Supabase
* Verify authentication redirect URLs in both Supabase and Google OAuth

---

## Future Work

* UI consistency improvements
* Performance optimizations
* Enhanced key management
* Improved mobile interactions

---

## Author

Mihir Mulchandani

For collaboration or opportunities, feel free to reach out.
