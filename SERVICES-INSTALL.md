# Services Marketplace — Install Guide

A complete local services marketplace for Scholr — like Urban Company / TaskRabbit, but built into your platform. Users can both **provide** services and **book** services from nearby providers.

## Features

✅ **14 service categories** (Driver, Cook, Salon, Tech, Healthcare, etc.) + "Other" custom option  
✅ **Provider profiles** with photo, pricing, skills, portfolio, service area  
✅ **Geolocation filtering** — only shows providers within search radius AND within provider's own service radius  
✅ **Booking system** with status flow: PENDING → ACCEPTED/REJECTED → IN_PROGRESS → COMPLETED  
✅ **Star ratings & reviews** (1-5 stars + text review + provider reply)  
✅ **In-app chat** between customer and provider (polling, ready for WebSocket upgrade)  
✅ **Real-time notifications** via existing notifications system  
✅ **Favorites / Save providers**  
✅ **Report system** with 7 reasons (fake, spam, inappropriate, fraud, etc.)  
✅ **Admin moderation** — review reports, deactivate providers, verify badges  
✅ **Light/dark mode** with proper black/white font colors  
✅ **Fully mobile + desktop responsive**

---

## File structure

```
backend/
  src/
    controllers/
      serviceMarketplace.controller.ts    ← NEW (full marketplace logic + geo)
    routes/
      serviceMarketplace.routes.ts        ← NEW (all endpoints)
    routes/index.ts                       ← MODIFIED (mount routes)
  prisma/
    schema.prisma                         ← MODIFIED (add 6 models + enums)

frontend/
  src/pages/services/
    Services.tsx                          ← NEW — discovery / listing
    BecomeProvider.tsx                    ← NEW — provider profile setup
    ProviderDetail.tsx                    ← NEW — public provider page
    BookService.tsx                       ← NEW — booking form
    MyBookings.tsx                        ← NEW — bookings for both roles + rating
    ServiceChat.tsx                       ← NEW — chat thread per booking
    styles/                               ← NEW — separate .css per page
      Services.css
      BecomeProvider.css
      ProviderDetail.css
      BookService.css
      MyBookings.css
      ServiceChat.css
  src/App.tsx                             ← MODIFIED — add routes
```

---

## Install — Step by step

### 1. Extract the zip

```powershell
Expand-Archive C:\Users\rraj8\Downloads\scholr-services.zip -DestinationPath C:\Users\rraj8\scholr -Force
```

### 2. Add schema models

Open `C:\Users\rraj8\scholr\backend\prisma\schema.prisma` and:

**a)** Add ALL the content from `backend/prisma/services-schema.prisma` (in the zip) at the bottom of your `schema.prisma`.

**b)** Find your `User` model and add these relations inside it:

```prisma
model User {
  // ... your existing fields ...
  
  // Service marketplace
  serviceProfile        ServiceProfile?         @relation("UserServiceProfile")
  serviceBookings       ServiceBooking[]        @relation("CustomerBookings")
  serviceReviews        ServiceReview[]         @relation("CustomerReviews")
  serviceFavorites      ServiceFavorite[]
  serviceReports        ServiceProviderReport[]
}
```

### 3. Push schema to DB

```powershell
cd C:\Users\rraj8\scholr\backend
npx prisma db push
```

You'll see "Your database is now in sync with your Prisma schema."

### 4. Mount the route in `routes/index.ts`

Add this line near your other route imports:

```ts
import serviceMarketplaceRoutes from './serviceMarketplace.routes.js';
```

And add this line to mount it:

```ts
router.use('/services', serviceMarketplaceRoutes);
```

### 5. Add routes in `App.tsx`

Add these imports near the top:

```tsx
import Services from './pages/services/Services';
import BecomeProvider from './pages/services/BecomeProvider';
import ProviderDetail from './pages/services/ProviderDetail';
import BookService from './pages/services/BookService';
import MyBookings from './pages/services/MyBookings';
import ServiceChat from './pages/services/ServiceChat';
```

Add these routes inside your `<Routes>`:

```tsx
<Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
<Route path="/services/become-provider" element={<ProtectedRoute><BecomeProvider /></ProtectedRoute>} />
<Route path="/services/provider/:providerId" element={<ProtectedRoute><ProviderDetail /></ProtectedRoute>} />
<Route path="/services/book/:providerId" element={<ProtectedRoute><BookService /></ProtectedRoute>} />
<Route path="/services/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
<Route path="/services/chat/:bookingId" element={<ProtectedRoute><ServiceChat /></ProtectedRoute>} />
```

### 6. Restart backend

```powershell
cd C:\Users\rraj8\scholr\backend
# Ctrl+C, then:
npm run dev
```

Frontend hot-reloads.

### 7. Add a link to the sidebar

In your `DashboardLayout.tsx`, add a "Services" link in the sidebar nav pointing to `/services`. Suggested icon: 🛠️ or `wrench-icon`.

---

## How to test

### Customer flow
1. Sign in
2. Go to `/services`
3. Allow location access when prompted
4. Browse providers near you (you'll see "No providers found" until at least one provider exists nearby — create one with another account)
5. Filter by category, radius, rating
6. Click a provider → see their full profile, reviews
7. Click "Book Now" → fill the form → submit
8. You'll be taken to `/services/my-bookings` (Customer tab)
9. Wait for provider to accept
10. Once accepted, you'll see the provider's phone number
11. After completion, click "⭐ Rate service" to leave a review

### Provider flow
1. Sign in as a DIFFERENT account (use incognito)
2. Go to `/services` → click "Become a provider"
3. Fill in profile (category, location, radius, pricing)
4. Click "Use my current location" — IMPORTANT, you can't save without coords
5. Pick service radius (5 / 10 / 25 / 50 km)
6. Save profile
7. Go to `/services/my-bookings` → switch to "As Provider" tab
8. See incoming requests → click "Accept" or "Reject"
9. After service is done, click "Mark complete" + enter final price

### Both — Chat
- From any active booking, click "💬 Chat" → see the booking-scoped chat thread
- Messages refresh every 5 seconds (polling)
- For real-time, swap in Socket.IO later (the controller already emits `chat:message` events)

### Admin flow
- Login as SUPER_ADMIN / SCHOOL_ADMIN / COLLEGE_ADMIN
- Go to `/admin/service-reports` (build this page later — endpoint is `/api/services/admin/reports`)
- Review reports → DEACTIVATE / DISMISS

---

## Geolocation behavior (important!)

The system uses **two-way radius filtering**:
- **Customer's search radius** — how far they want to look (default 25 km)
- **Provider's service radius** — how far they're willing to travel (5/10/25/50 km)

A provider only appears if **BOTH** are satisfied. Example:
- Customer searches within 25 km
- Provider 8 km away set their radius to 5 km → ❌ won't appear (customer is outside provider's range)
- Provider 8 km away set their radius to 10 km → ✅ appears

This means providers control who can see them — a salon willing to travel 10 km doesn't get bombarded with requests from 50 km away.

---

## API endpoints

```
Provider profile (mine):
  GET    /api/services/me/profile           Get my provider profile
  POST   /api/services/me/profile           Create or update my profile
  PATCH  /api/services/me/availability      Update availability (AVAILABLE/BUSY/OFFLINE)
  POST   /api/services/me/deactivate        Soft-disable profile

Discovery (any signed-in user):
  GET    /api/services/providers            List nearby providers (?lat&lng&radius&category&minRating&search)
  GET    /api/services/providers/:id        Get provider public profile with reviews

Favorites:
  GET    /api/services/favorites            List my saved providers
  POST   /api/services/favorites/:id        Toggle favorite

Bookings:
  POST   /api/services/bookings             Create booking
  GET    /api/services/bookings             List my bookings (?role=customer|provider&status=...)
  GET    /api/services/bookings/:id         Get booking details
  POST   /api/services/bookings/:id/respond Provider: accept/reject ({action: ACCEPT|REJECT, providerNote})
  POST   /api/services/bookings/:id/complete  Provider: mark complete ({finalPrice})
  POST   /api/services/bookings/:id/cancel  Cancel ({reason})

Reviews:
  POST   /api/services/reviews              Create review ({bookingId, rating, comment})
  POST   /api/services/reviews/:id/reply    Provider replies to review ({reply})

Chat:
  GET    /api/services/chat/:bookingId      Get chat thread + mark read
  POST   /api/services/chat/:bookingId/messages  Send message ({content})

Reports:
  POST   /api/services/providers/:id/report  Report provider ({reason, details})

Admin:
  GET    /api/services/admin/reports        List reports (?status=PENDING)
  POST   /api/services/admin/reports/:id/review  Review report ({action: DEACTIVATE|DISMISS, note})
  POST   /api/services/admin/providers/:id/verify  Toggle verified badge ({verified: true|false})
```

---

## Upgrading to real-time (Socket.IO)

The controller already emits these events when Socket.IO is mounted on the app:
- `booking:new` — provider gets notified of new booking
- `booking:update` — customer gets notified of accept/reject
- `chat:message` — recipient gets new chat message

To enable real-time, set up Socket.IO on your backend `index.ts`:

```ts
import { Server } from 'socket.io';
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

io.use((socket, next) => {
  // authenticate via JWT (similar to your existing auth middleware)
  // attach socket to user:${userId} room on connect
});

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  socket.join(`user:${userId}`);
});
```

Then on the frontend, in `ServiceChat.tsx` and `MyBookings.tsx`, connect with socket.io-client and listen for those events instead of polling.

---

## Known limitations & future work

- **No file uploads in chat** — text only for v1
- **No image upload for portfolio** — uses URLs only (add multer integration later)
- **Polling chat (5s)** — replace with WebSocket for true real-time
- **No advanced search** — could add full-text search index
- **No service packages / bundles** — only flat rates / hourly
- **No payment integration** — cash/UPI between parties for v1; add Razorpay/Stripe later

---

## Files included in this zip

```
backend/
  prisma/services-schema.prisma           ← Add to your schema.prisma
  src/controllers/serviceMarketplace.controller.ts
  src/routes/serviceMarketplace.routes.ts

frontend/src/pages/services/
  Services.tsx
  BecomeProvider.tsx
  ProviderDetail.tsx
  BookService.tsx
  MyBookings.tsx
  ServiceChat.tsx
  styles/Services.css
  styles/BecomeProvider.css
  styles/ProviderDetail.css
  styles/BookService.css
  styles/MyBookings.css
  styles/ServiceChat.css

SERVICES-INSTALL.md (this file)
```
