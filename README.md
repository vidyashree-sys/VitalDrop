# 🩸 VitalDrop - The Network for Life

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

**VitalDrop** is a decentralized, real-time command center connecting the healthcare ecosystem. Built for the **Google Solution Challenge 2026**, it leverages geospatial targeting and WebSockets to optimize emergency blood delivery, ensuring no life is lost due to logistical delays.

🌍 **Targeting UN Sustainable Development Goals:**
* **Goal 3:** Good Health and Well-being
* **Goal 9:** Industry, Innovation and Infrastructure

---

## 🚀 Live Links
* **Live Prototype:**https://vitaldrop-83nr.onrender.com
* **Demo Video:**https://youtu.be/NwBjB6G9AZk
---

## ✨ Key Features & Technical Highlights

### 1. 🚨 5km Geospatial Radar (Code Red)
When a hospital initiates an Emergency SOS, MongoDB Geospatial queries (`$near`, `$geometry`) calculate a precise 5km radius to instantly alert only the closest Blood Banks and active Ambulance Drivers, eliminating network noise and reducing latency.

### 2. 🔒 Mutex Locking & Atomic Transactions
To prevent multiple drivers or banks from claiming the same emergency request, VitalDrop uses MongoDB's `findOneAndUpdate` atomic operations. Once a node accepts a request, it is instantly ripped from all other screens network-wide, guaranteeing single-dispatch safety.

### 3. 📡 Real-Time Live Tracking
Powered by **Socket.io**, the platform features a "God-Mode" Admin Radar and individual facility maps. As ambulances move, their GPS coordinates are broadcasted to the socket room, updating the Leaflet maps in real-time across the network.

### 4. 🛡️ Two-Factor Delivery Authentication
* **Phase 1 (Pickup):** Drivers must physically scan a dynamic **QR Code** at the Blood Bank to unlock the container.
* **Phase 2 (Drop-off):** Hospitals provide a secure **4-Digit OTP** generated at the time of the SOS to verify the secure handover of the blood units.

### 5. ❤️ Crowdsourced Hero Donors
During critical shortages, the network broadcasts public alerts to verified donors matching the required blood type (or O- universal donors), allowing them to pledge their arrival in real-time to stabilize hospital queues.

---

## 🏗️ System Architecture

* **Frontend:** React.js, Vite, Tailwind CSS, Lucide Icons, React-Leaflet (Maps), Axios.
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB Atlas (with Geospatial Indexing).
* **Real-time Engine:** Socket.io (WebSocket Protocol).
* **Deployment:** Render (Unified Cloud Web Service).

---

## ⚙️ Local Setup & Installation

To run this project locally, follow these steps:

### Prerequisites
* Node.js (v20 or v22 recommended)
* MongoDB Atlas Account (or local MongoDB)

### 1. Clone the repository
https://github.com/vidyashree-sys/VitalDrop
cd VitalDrop

### 2. Setup Environment Variables
Create a .env file in the backend folder and add the following:
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key

### 3. Install Dependencies
This project uses a monorepo structure. You need to install dependencies for both the frontend and backend.
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

### 4. Run the Application
Terminal 1 (Backend):
cd backend
node server.js
Terminal 2 (Frontend):
cd frontend
npm run dev
The application will be available at http://localhost:5173

🌐 Cloud Deployment (Render)
This application is configured for a unified deployment on Render using a single Web Service.

Build Command: npm install && cd ../frontend && npm install && npm run build

Start Command: node server.js

Note: Ensure your MongoDB Network Access allows 0.0.0.0/0 so the cloud server can connect to your database.
```bash
git clone [https://github.com/](https://github.com/)<YOUR_GITHUB_USERNAME>/VitalDrop.git
cd VitalDrop
