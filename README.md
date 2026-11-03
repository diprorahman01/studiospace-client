# StudioSpace — Creative Studio Booking Marketplace

**Live website:** https://studiospace-client-five.vercel.app

StudioSpace connects photographers, filmmakers, musicians, podcasters, and creators with bookable professional studios. Studio owners can publish spaces and manage reservations; creators can explore listings, compare spaces, and request time slots with transparent US-dollar pricing.

## Highlights

- **Explore studios:** browse by category, location, amenities, capacity, and hourly price.
- **Studio details:** image gallery, amenities, host information, reviews, and live availability.
- **Booking system:** authenticated booking requests, collision handling, cancellations, rescheduling, and status tracking.
- **Host tools:** listings CRUD, availability blocking, calendar, booking approvals, and analytics.
- **Saved studios:** personal wishlist synchronized with MongoDB (requires server deployment).
- **Responsive experience:** mobile, tablet, desktop, and light/dark theme support.
- **Receipts:** downloadable PDF booking confirmations for eligible confirmed/completed reservations.

## Technology

- Frontend: Next.js App Router, TypeScript, React, Tailwind CSS, Lucide icons, Sonner, Swiper.
- Authentication: Better Auth, Google social sign-in, MongoDB adapter.
- Backend: Node.js, Express.js and MongoDB Atlas.
- Deployment: Vercel (client) and Render (API).

## Local setup

1. Clone the two GitHub repositories:
   - Client: https://github.com/diprorahman01/studiospace-client
   - Server: https://github.com/diprorahman01/studiospace-server
2. In each repository run `npm install`.
3. Configure **local** environment variables in untracked `.env.local` (client) and `.env` (server). Never commit secrets.
4. Client requires Better Auth connection and Google OAuth variables; server requires MongoDB Atlas URI and `CLIENT_URL`.
5. Run the server with `npm run dev` (or `node index.js`), then the client with `npm run dev`.
6. Open http://localhost:3000 and check the API at http://localhost:5000/api/health.
7. Run `npx tsc --noEmit` and `npm run build` in the client. Run the server's syntax and booking index checks before accepting reservations.

## Examiner test credentials

**Create a dedicated examiner account in the deployed application and supply its email/password privately in your submission.** Do not publish passwords in this public repository. For testing Google login, use a permitted Google account. An examiner test account should be granted no administrator privileges unless the task explicitly requires administrative testing.

Suggested assessment walkthrough: log in; inspect a featured studio; test category/price filters; reserve a future unoccupied slot; open My Bookings; add a studio as a host; edit or delete a test listing; inspect Host Calendar, Analytics and Availability; switch the theme; test a non-existent URL.

## Security notes

All sensitive mutations are authenticated and user-owned records are scoped on the server. The application uses Better Auth's HTTPOnly session-cookie design; **it additionally enables a short-lived JWT-formatted HTTPOnly session-data cache cookie, but the primary session token remains opaque** without separately verifying that configuration. Booking collision protection requires the named MongoDB **unique active booking-slot index**, installed and verified using the server scripts in this upgrade. Never enable a new index over conflicting historical bookings without resolving them first.

## Limitations

Confirmed booking amounts are not proof of payment. The downloadable PDF is a booking confirmation/price record, not a paid tax invoice. The sample newsletter UI does not represent a deployed mailing list. Studio ratings are derived from submitted reviews when review APIs are enabled.


## Frontend_(Client):
npm install
npm run dev

## Backend (Server):
npm install
npm run dev