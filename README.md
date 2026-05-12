# 🍔 Zing — Real-Time Food Delivery & Restaurant Booking Platform

> A full-stack food delivery and table-booking application with **live GPS tracking**, **WebSocket-powered order updates**, **role-based access control**, and a modern React frontend.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Features](#features)
6. [Data Models & Database Schema](#data-models--database-schema)
7. [API Reference](#api-reference)
8. [WebSocket Protocol](#websocket-protocol)
9. [Authentication & Roles](#authentication--roles)
10. [Frontend Pages & Routes](#frontend-pages--routes)
11. [Frontend Components & Hooks](#frontend-components--hooks)
12. [Configuration & Environment Variables](#configuration--environment-variables)
13. [Getting Started](#getting-started)
14. [Docker Deployment](#docker-deployment)
15. [Order Status Lifecycle](#order-status-lifecycle)

---

## Overview

**Zing** is a production-ready, real-time food delivery platform. Customers can browse restaurants, place orders, book tables, and track their delivery on a live map. Restaurant owners manage menus and incoming orders through a dashboard. Delivery partners pick up orders and broadcast their GPS location over WebSockets. Admins oversee users, restaurants, and system stats.

## Screenshots

<div align="center">
  <img src="docs/images/home_page.png" alt="Zing Home Page" width="800"/>
  <br/>
  <em>Customer Homepage with Restaurant Discovery</em>
  <br/><br/>
  
  <img src="docs/images/live_tracking.png" alt="Live Order Tracking" width="800"/>
  <br/>
  <em>Live GPS Order Tracking & Real-Time Status</em>
  <br/><br/>
  
  <img src="docs/images/restaurant_dashboard.png" alt="Restaurant Dashboard" width="800"/>
  <br/>
  <em>Restaurant Dashboard with Earnings & Order Management</em>
  <br/><br/>
  
  <img src="docs/images/delivery_partner_tracking.png" alt="Delivery Partner Tracking" width="800"/>
  <br/>
  <em>Delivery Partner Live GPS Tracking Map</em>
  <br/><br/>
  
  <img src="docs/images/delivery_dashboard.png" alt="Delivery Dashboard" width="800"/>
  <br/>
  <em>Delivery Partner Earnings & Active Orders Dashboard</em>
</div>

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | Spring Boot 4.0.2 |
| Language | Java 17 |
| Security | Spring Security + JWT (JJWT 0.12.5) |
| Database | MySQL 8 (HikariCP pool) |
| ORM | Spring Data JPA / Hibernate |
| Real-time | Spring WebSocket (STOMP over SockJS) |
| File Storage | Cloudinary |
| API Docs | SpringDoc OpenAPI (Swagger UI) |
| Build | Apache Maven |
| Containerisation | Docker (multi-stage) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Routing | React Router DOM v7 |
| HTTP | Axios |
| WebSocket | STOMP.js + SockJS-client |
| Maps | React-Leaflet + Leaflet.js |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Styling | Tailwind CSS v4 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      React Frontend                      │
│  (Vite · React Router · Axios · STOMP · Leaflet)        │
└────────────────────────┬────────────────────────────────┘
                         │  HTTP REST  /  WebSocket (STOMP)
┌────────────────────────▼────────────────────────────────┐
│                   Spring Boot Backend                    │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌────────────────────┐   │
│  │   REST   │  │ WebSocket │  │   Spring Security  │   │
│  │Controllers│  │ Controller│  │   JWT Filter       │   │
│  └────┬─────┘  └─────┬─────┘  └────────────────────┘   │
│       │              │                                   │
│  ┌────▼──────────────▼──────────────────────────────┐   │
│  │              Service Layer                        │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │         Spring Data JPA Repositories              │   │
│  └──────────────────────┬───────────────────────────┘   │
└───────────────────────── │──────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │       MySQL Database     │
              └─────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   Cloudinary (Images)    │
              └─────────────────────────┘
```

---

## Project Structure

```
zing-backend/                        ← Mono-repo root
├── zing-backend/                    ← Spring Boot application
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/zing/
│       ├── ZingApplication.java
│       ├── config/
│       │   ├── CloudinaryConfig.java
│       │   ├── CorsConfig.java
│       │   ├── JwtConfig.java
│       │   ├── SecurityConfig.java
│       │   ├── SwaggerConfig.java
│       │   ├── WebMvcConfig.java
│       │   └── WebSocketConfig.java
│       ├── constants/
│       │   ├── AppConstants.java
│       │   ├── BookingStatus.java   ← PENDING | CONFIRMED | CANCELLED
│       │   └── OrderStatus.java     ← PLACED→ACCEPTED→PREPARING→OUT_FOR_DELIVERY→DELIVERED | CANCELLED
│       ├── controller/
│       │   ├── AdminController.java
│       │   ├── AuthController.java
│       │   ├── BookingController.java
│       │   ├── DeliveryController.java
│       │   ├── FileUploadController.java
│       │   ├── MenuController.java
│       │   ├── OrderController.java
│       │   ├── RestaurantController.java
│       │   ├── TrackingController.java
│       │   └── UserController.java
│       ├── dto/
│       ├── exception/
│       ├── model/
│       │   ├── Booking.java
│       │   ├── DeliveryPartner.java
│       │   ├── MenuItem.java
│       │   ├── Order.java
│       │   ├── OrderItem.java
│       │   ├── Restaurant.java
│       │   ├── Role.java
│       │   └── User.java
│       ├── repository/
│       ├── service/
│       ├── util/
│       └── websocket/
│           └── DeliverySocketController.java
│
└── zing-frontend/                   ← React + Vite application
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── api/
        ├── components/
        │   ├── Footer.jsx
        │   ├── LiveTrackingMap.jsx
        │   ├── MenuItemCard.jsx
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   └── RestaurantCard.jsx
        ├── context/
        │   ├── AuthContext.jsx
        │   ├── CartContext.jsx
        │   └── ThemeContext.jsx
        ├── hooks/
        │   └── useGeolocation.js
        └── pages/
            ├── AdminDashboardPage.jsx
            ├── BookingsPage.jsx
            ├── CartPage.jsx
            ├── DashboardPage.jsx
            ├── DeliveryDashboardPage.jsx
            ├── HomePage.jsx
            ├── LoginPage.jsx
            ├── MyOrdersPage.jsx
            ├── NotFoundPage.jsx
            ├── OrderTrackingPage.jsx
            ├── RestaurantDetailPage.jsx
            ├── RestaurantsPage.jsx
            └── SignupPage.jsx
```

---

## Features

### Customer (Role: `USER`)
- Browse all restaurants and menu items on the homepage
- Filter restaurants by city or find nearby ones using GPS
- Add items to cart and place orders
- Book a restaurant table for a specific date, time, and party size
- Track live delivery location on an interactive Leaflet map
- View full order history with status updates

### Restaurant Owner (Role: `RESTAURANT`)
- Create and manage restaurant listings (name, address, city, lat/lng, image)
- Add, update, and manage menu items with images (Cloudinary)
- View incoming orders on a real-time dashboard
- Accept, reject, or advance order status (`ACCEPTED → PREPARING`)

### Delivery Partner (Role: `DELIVERY`)
- View all available orders ready for pickup
- Pick up an order and broadcast live GPS location over WebSocket
- Mark orders as delivered
- View earnings dashboard (fee = max(₹30, 10% of order total))
- View personal delivery history and statistics

### Admin (Role: `ADMIN`)
- View platform-wide stats (total users, restaurants, orders, breakdown by role)
- List and delete user accounts
- Promote/change user roles dynamically
- Health-check endpoint

---

## Data Models & Database Schema

### `users`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT |
| `name` | VARCHAR | |
| `email` | VARCHAR | UNIQUE, NOT NULL |
| `password` | VARCHAR | NOT NULL (BCrypt) |
| `phone` | VARCHAR | |
| `role` | ENUM | `USER`, `RESTAURANT`, `DELIVERY`, `ADMIN` |

### `restaurants`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT |
| `name` | VARCHAR | |
| `address` | VARCHAR | |
| `city` | VARCHAR | |
| `open` | BOOLEAN | |
| `image_url` | VARCHAR | |
| `latitude` | DOUBLE | |
| `longitude` | DOUBLE | |
| `owner_id` | BIGINT | FK → `users.id`, NOT NULL |

### `menu_items`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT |
| `name` | VARCHAR | |
| `description` | VARCHAR | |
| `price` | DOUBLE | |
| `available` | BOOLEAN | |
| `image_url` | VARCHAR | |
| `restaurant_id` | BIGINT | FK → `restaurants.id` |

### `orders`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT |
| `user_id` | BIGINT | FK → `users.id` |
| `restaurant_id` | BIGINT | FK → `restaurants.id` |
| `delivery_partner_id` | BIGINT | FK → `users.id` (nullable) |
| `status` | ENUM | `PLACED`, `ACCEPTED`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED` |
| `total_amount` | DOUBLE | |
| `created_at` | DATETIME | |
| `delivered_at` | DATETIME | nullable |
| `delivery_lat` | DOUBLE | nullable — partner's live lat |
| `delivery_lng` | DOUBLE | nullable — partner's live lng |
| `customer_lat` | DOUBLE | nullable |
| `customer_lng` | DOUBLE | nullable |
| `delivery_address` | VARCHAR | |

### `bookings`
| Column | Type | Constraints |
|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT |
| `user_id` | BIGINT | FK → `users.id` |
| `restaurant_id` | BIGINT | FK → `restaurants.id` |
| `booking_date` | DATE | |
| `booking_time` | TIME | |
| `people_count` | INT | |
| `status` | ENUM | `PENDING`, `CONFIRMED`, `CANCELLED` |

### Entity Relationship Diagram

```
User (1) ──────< Restaurant (many)   [owner]
User (1) ──────< Order (many)        [customer]
User (1) ──────< Order (many)        [delivery_partner]
User (1) ──────< Booking (many)
Restaurant (1) ─< MenuItem (many)
Restaurant (1) ─< Order (many)
Restaurant (1) ─< Booking (many)
Order (1) ──────< OrderItem (many)
MenuItem (1) ───< OrderItem (many)
```

---

## API Reference

> Base URL: `http://localhost:8080`
> All protected endpoints require: `Authorization: Bearer <JWT_TOKEN>`

---

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and get JWT token |

**POST `/api/auth/signup` — Request Body**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "phone": "9876543210",
  "role": "USER"
}
```

**Response**
```json
{
  "token": "<JWT>",
  "user": { "id": 1, "name": "Jane Doe", "email": "jane@example.com", "role": "USER" }
}
```

---

### Restaurants — `/api/restaurants`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/restaurants` | Public | List all restaurants |
| GET | `/api/restaurants/{id}` | Public | Get restaurant by ID |
| GET | `/api/restaurants/city/{city}` | Public | Filter by city |
| GET | `/api/restaurants/nearby?lat=&lng=&radiusKm=` | Public | Sorted by distance (Haversine) |
| GET | `/api/restaurants/my` | RESTAURANT | Owner's own restaurants |
| POST | `/api/restaurants` | RESTAURANT | Create a restaurant |

---

### Menu — `/api/menus`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/menus/all` | Public | All menu items (with restaurant info) |
| GET | `/api/menus/{restaurantId}` | Public | Menu for a restaurant |
| POST | `/api/menus/{restaurantId}` | RESTAURANT | Add a menu item |

---

### Orders — `/api/orders`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/orders` | USER | Place an order |
| GET | `/api/orders/my` | USER | My order history |
| GET | `/api/orders/my/{id}` | USER | Single order detail |
| GET | `/api/orders/restaurant` | RESTAURANT | Orders for my restaurant |
| PUT | `/api/orders/restaurant/{id}/accept` | RESTAURANT | Accept a PLACED order |
| PUT | `/api/orders/restaurant/{id}/reject` | RESTAURANT | Cancel a PLACED order |
| PUT | `/api/orders/restaurant/{id}/prepare` | RESTAURANT | Advance to PREPARING |

**POST `/api/orders` — Request Body**
```json
{
  "restaurantId": 1,
  "items": [
    { "menuItemId": 3, "quantity": 2 },
    { "menuItemId": 7, "quantity": 1 }
  ],
  "deliveryAddress": "123 Main Street",
  "customerLat": 22.5726,
  "customerLng": 88.3639
}
```

---

### Delivery — `/api/delivery`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/delivery/available` | DELIVERY | Orders ready for pickup |
| GET | `/api/delivery/active` | DELIVERY | My active deliveries |
| GET | `/api/delivery/history` | DELIVERY | My completed deliveries |
| GET | `/api/delivery/stats` | DELIVERY | Earnings and delivery stats |
| PUT | `/api/delivery/orders/{id}/pickup` | DELIVERY | Claim and pick up an order |
| PUT | `/api/delivery/orders/{id}/deliver` | DELIVERY | Mark order as delivered |
| PUT | `/api/delivery/orders/{id}/location` | DELIVERY | Push live GPS coords (persisted) |
| GET | `/api/delivery/orders/{id}/location` | DELIVERY | Get last known location |

**PUT `/api/delivery/orders/{id}/location` — Request Body**
```json
{ "lat": 22.5726, "lng": 88.3639 }
```

---

### Tracking — `/api/tracking`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tracking/orders/{id}/location` | Public | Customer-facing delivery location |

**Response**
```json
{
  "orderId": 42,
  "lat": 22.5726,
  "lng": 88.3639,
  "status": "OUT_FOR_DELIVERY",
  "partnerName": "Ravi Kumar",
  "restaurantName": "Spice Garden",
  "restaurantAddress": "45 Park Street",
  "restaurantCity": "Kolkata"
}
```

---

### Bookings — `/api/bookings`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/bookings` | USER | Book a table |
| GET | `/api/bookings/restaurant/{restaurantId}` | RESTAURANT | View bookings for a restaurant |

**POST `/api/bookings` — Request Body**
```json
{
  "restaurantId": 5,
  "bookingDate": "2026-06-15",
  "bookingTime": "19:30",
  "peopleCount": 4
}
```

---

### File Upload — `/api/files`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/files/upload` | Any authenticated | Upload image to Cloudinary, returns URL |

---

### Admin — `/api/admin`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/health` | ADMIN | Backend health check |
| GET | `/api/admin/stats` | ADMIN | Platform statistics |
| GET | `/api/admin/users` | ADMIN | List all users |
| DELETE | `/api/admin/users/{id}` | ADMIN | Delete a user |
| PUT | `/api/admin/users/{id}/role?role=` | ADMIN | Change user role |

---

## WebSocket Protocol

### Connection
```
URL:      ws://localhost:8080/ws
Protocol: STOMP over SockJS
```

### Send Location (Delivery Partner → Server)
```
Destination: /app/delivery/location
```
**Payload:**
```json
{
  "orderId": 42,
  "lat": 22.5726,
  "lng": 88.3639,
  "heading": 180.0,
  "speed": 12.5,
  "accuracy": 5.0,
  "partnerId": 7,
  "partnerName": "Ravi Kumar"
}
```

### Subscribe to Live Location (Customer)
```
Topic: /topic/delivery-location/{orderId}
```
The server automatically appends a `timestamp` (Unix ms) to each broadcast message.

### Frontend Integration Pattern
```javascript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const client = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
  onConnect: () => {
    // Customer subscribes
    client.subscribe(`/topic/delivery-location/${orderId}`, (msg) => {
      const data = JSON.parse(msg.body);
      // update map marker with data.lat, data.lng
    });

    // Delivery partner publishes
    client.publish({
      destination: '/app/delivery/location',
      body: JSON.stringify({ orderId, lat, lng, heading, speed, accuracy, partnerId, partnerName }),
    });
  },
});
client.activate();
```

---

## Authentication & Roles

Zing uses **stateless JWT authentication**. On login, a signed JWT (HS256, 24 h expiry) is returned. The frontend stores it in `localStorage` and sends it as a Bearer token on every request.

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Roles

| Role | Description | Key Permissions |
|---|---|---|
| `USER` | Regular customer | Browse, order, book, track |
| `RESTAURANT` | Restaurant owner | Manage restaurant & menu, handle orders |
| `DELIVERY` | Delivery partner | Pick up orders, push GPS, mark delivered |
| `ADMIN` | Platform administrator | Manage all users, view stats |

### Protected Route (Frontend)
```jsx
<ProtectedRoute roles={['USER']}>
  <CartPage />
</ProtectedRoute>
```
`ProtectedRoute` reads the JWT from `AuthContext`, decodes the role, and redirects to `/login` if unauthorized.

---

## Frontend Pages & Routes

| Path | Component | Access | Description |
|---|---|---|---|
| `/` | `HomePage` | Public | Landing page with featured restaurants & menu items |
| `/login` | `LoginPage` | Public | Login form |
| `/signup` | `SignupPage` | Public | Registration with role selection |
| `/restaurants` | `RestaurantsPage` | Public | Browse all restaurants |
| `/restaurants/:id` | `RestaurantDetailPage` | Public | Restaurant menu & booking |
| `/cart` | `CartPage` | USER | Cart review & checkout |
| `/orders` | `MyOrdersPage` | USER | Order history |
| `/orders/:id/track` | `OrderTrackingPage` | USER | Live map tracking |
| `/bookings` | `BookingsPage` | USER | Table bookings |
| `/dashboard` | `DashboardPage` | RESTAURANT | Restaurant owner dashboard |
| `/admin` | `AdminDashboardPage` | ADMIN | Admin control panel |
| `/deliveries` | `DeliveryDashboardPage` | DELIVERY | Delivery partner dashboard |
| `*` | `NotFoundPage` | Public | 404 page |

---

## Frontend Components & Hooks

### Components

| Component | Description |
|---|---|
| `Navbar` | Responsive navigation with role-aware links, dark mode toggle, cart badge |
| `Footer` | Site footer with links |
| `LiveTrackingMap` | Leaflet map showing delivery partner's live marker, restaurant pin, and customer pin. Reconnects WebSocket on mount. |
| `RestaurantCard` | Card for restaurant listings with distance badge |
| `MenuItemCard` | Menu item display with Add to Cart action |
| `ProtectedRoute` | HOC that guards routes by JWT role |

### Context Providers

| Context | State |
|---|---|
| `AuthContext` | `user`, `token`, `login()`, `logout()` |
| `CartContext` | `items`, `addItem()`, `removeItem()`, `clearCart()`, `total` |
| `ThemeContext` | `theme`, `toggleTheme()` (`light` / `dark`) |

### Custom Hooks

#### `useGeolocation(options)`
Wraps the browser Geolocation API with `watchPosition` for real-time GPS.

```javascript
const { lat, lng, accuracy, heading, speed, error, loading } = useGeolocation({
  enabled: true,       // activate tracking
  highAccuracy: true,  // use GPS
  maxAge: 5000,        // ms
  timeout: 15000,      // ms
});
```

---

## Configuration & Environment Variables

### Backend (`application.properties`)

| Property / Env Var | Default | Description |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/zing_db` | MySQL JDBC URL |
| `DB_USERNAME` | `root` | Database username |
| `DB_PASSWORD` | `12345` | Database password |
| `JWT_SECRET` | `zing-secret-key-256-bit-length-for-hs256!!` | HS256 signing key |
| `jwt.expiration` | `86400000` | Token expiry in ms (24 h) |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin |
| `CLOUDINARY_URL` | — | Cloudinary connection string |
| `server.port` | `8080` | API server port |

### Frontend (`vite.config.js` / `.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend REST base URL |

---

## Getting Started

### Prerequisites
- Java 17+
- Maven 3.9+
- Node.js 20+ & npm
- MySQL 8 running locally
- (Optional) Docker & Docker Compose

---

### 1. Database Setup

```sql
CREATE DATABASE zing_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Hibernate will auto-create all tables on first run (`ddl-auto=update`).

---

### 2. Backend Setup

```bash
cd zing-backend

# Configure your local DB credentials (or set env vars)
# Edit: src/main/resources/application.properties

# Build & run
./mvnw spring-boot:run
```

The API will be available at `http://localhost:8080`.

Swagger UI: `http://localhost:8080/swagger-ui.html`

---

### 3. Frontend Setup

```bash
cd zing-frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:5173` (Vite default).

---

### 4. Create Initial Admin User

After the backend starts, register a user normally via `/api/auth/signup`, then promote them to ADMIN directly in the database:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@zing.com';
```

Or use the admin API once you have an existing ADMIN token:

```bash
curl -X PUT "http://localhost:8080/api/admin/users/1/role?role=ADMIN" \
  -H "Authorization: Bearer <ADMIN_JWT>"
```

---

## Docker Deployment

### Build & Run Backend Container

```bash
cd zing-backend

docker build -t zing-backend:latest .

docker run -d \
  -p 8080:8080 \
  -e DB_URL="jdbc:mysql://host.docker.internal:3306/zing_db" \
  -e DB_USERNAME="root" \
  -e DB_PASSWORD="yourpassword" \
  -e JWT_SECRET="your-strong-256-bit-secret" \
  -e FRONTEND_URL="http://localhost:5173" \
  -e CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name" \
  --name zing-api \
  zing-backend:latest
```

### Dockerfile Overview

```dockerfile
# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src src
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## Order Status Lifecycle

```
  Customer places order
         │
         ▼
      [PLACED]
         │
    ┌────┴────┐
    │         │
    ▼         ▼
[ACCEPTED] [CANCELLED]  ← Restaurant rejects
    │
    ▼
[PREPARING]             ← Restaurant marks as preparing
    │
    ▼
[OUT_FOR_DELIVERY]      ← Delivery partner picks up
    │
    ▼
 [DELIVERED]            ← Delivery partner marks delivered
```

**Delivery Earnings Formula:**
```
fee = max(₹30, order.totalAmount × 10%)
```

---

## Swagger / API Docs

Once the backend is running, visit:

```
http://localhost:8080/swagger-ui.html
```

All endpoints are documented with request/response schemas. You can authorize with your JWT token directly in the Swagger UI.

---

## License

This project is for educational and demonstration purposes.

---

*Built with ❤️ using Spring Boot, React, and WebSockets.*
