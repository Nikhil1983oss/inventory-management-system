# Inventory and Data Management System

A RESTful inventory management API built with **Node.js, Express.js, MongoDB, and Mongoose** for Web Development III — Lab 3.

## Features
- Create, view, update, and delete products.
- Validate product details and maintain unique SKUs.
- Filter, sort, and paginate inventory records.
- Adjust stock quantities safely.
- Generate low-stock alerts.
- Generate category-wise inventory summaries using MongoDB aggregation.

## Tech Stack
- Node.js
- Express.js
- MongoDB
- Mongoose
- dotenv

## Setup

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file:

   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/inventoryDB
   ```

4. Start the server using your configured npm script, or run:

   ```bash
   node server.js
   ```

The API runs at `http://localhost:5000`.

## Main API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/products` | Create a product |
| GET | `/api/products` | List and filter products |
| GET | `/api/products/:id` | Get a product |
| PUT | `/api/products/:id` | Update a product |
| PATCH | `/api/products/:id/stock` | Adjust stock |
| DELETE | `/api/products/:id` | Delete a product |
| GET | `/api/products/low-stock` | View low-stock products |
| GET | `/api/products/summary` | View category-wise summary |

## Testing

API endpoints can be tested using Postman.

## Academic Project

**Course:** Web Development III  
**Assignment:** Lab 3 — Inventory and Data Management System