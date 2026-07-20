<div align="center">

# 💊 Blockchain-Based Pharmaceutical Supply Chain Management System

A secure and transparent pharmaceutical supply chain management system built using **Hyperledger Fabric**, **Node.js**, **Express.js**, **React (Vite)**, **Docker**, and **JWT Authentication**.

[![Hyperledger Fabric](https://img.shields.io/badge/Hyperledger-Fabric-blue.svg)](https://www.hyperledger.org/use/fabric)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB.svg)](https://react.dev/)
[![Express.js](https://img.shields.io/badge/Express.js-Backend-black.svg)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/Docker-Container-blue.svg)](https://www.docker.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-orange.svg)](https://jwt.io/)

</div>

---

# 📖 Overview

Counterfeit medicines and the lack of transparency in pharmaceutical supply chains can lead to serious health risks. This project leverages **Hyperledger Fabric**, a permissioned blockchain platform, to provide a secure, immutable, and transparent system for tracking pharmaceutical products from manufacturers to end consumers.

The system enables stakeholders to register medicines, transfer ownership, update locations, and verify the complete transaction history while ensuring data integrity through blockchain technology.

---

# ✨ Features

- 🔐 Secure JWT Authentication
- 👤 Role-Based Access Control
- 💊 Drug Registration
- 📍 Real-Time Drug Location Tracking
- 🔄 Ownership Transfer
- 📜 Immutable Blockchain Transaction History
- 🔍 Drug Lookup by Batch ID
- ⚡ RESTful API Architecture
- 🐳 Docker-Based Hyperledger Fabric Network

---

# 🏗️ System Architecture

```text
                    +----------------------+
                    |      React UI        |
                    +----------+-----------+
                               |
                               |
                        REST API (Express)
                               |
                               |
                    +----------+-----------+
                    |     Node.js Backend  |
                    +----------+-----------+
                               |
                               |
                    Hyperledger Fabric SDK
                               |
        -------------------------------------------------
        |                     |                         |
     Peer Org1             Peer Org2             Certificate Authority
        |                     |                         |
        ---------------- Blockchain Ledger -------------
```

---

# 🔄 Supply Chain Workflow

```text
Manufacturer
      │
      ▼
Register Drug
      │
      ▼
Distributor
      │
Transfer Ownership
      │
      ▼
Wholesaler
      │
Update Location
      │
      ▼
Pharmacy
      │
      ▼
Consumer
      │
Verify Product History
```

---

# 🛠️ Technology Stack

## Frontend

- React
- Vite
- JavaScript
- CSS

## Backend

- Node.js
- Express.js
- JWT Authentication
- Fabric SDK

## Blockchain

- Hyperledger Fabric
- Fabric CA
- Smart Contracts (Chaincode)

## Database

- Hyperledger Ledger (Blockchain World State)

## DevOps

- Docker
- Docker Compose

---

# 📂 Project Structure

```text
Blockchain-Based_Pharmaceutical-Supply-Chain
│
├── backend/
│   ├── routes/
│   ├── middleware/
│   ├── fabric/
│   ├── config/
│   └── app.js
│
├── chaincode/
│   └── drugcontract/
│
├── frontend/
│
├── README.md
└── .gitignore
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/Chethan-png/Blockchain-Based_Pharmaceutical-Supply-Chain.git

cd Blockchain-Based_Pharmaceutical-Supply-Chain
```

---

## Start Hyperledger Fabric

```bash
cd fabric-samples/test-network

./network.sh up createChannel

./network.sh deployCC
```

---

## Backend

```bash
cd backend

npm install

node app.js
```

Backend runs on

```
http://localhost:5000
```

---

## Frontend

```bash
cd pharma-frontend

npm install

npm run dev
```

Frontend runs on

```
http://localhost:5173
```

---

# 📡 REST APIs

## Authentication

| Method | Endpoint |
|---------|----------|
| POST | `/api/users/login` |

---

## Drug Management

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/drugs/register` | Register Drug |
| GET | `/api/drugs/:batchID` | Get Drug Details |
| POST | `/api/drugs/location` | Update Drug Location |
| POST | `/api/drugs/transfer` | Transfer Ownership |
| GET | `/api/drugs/:batchID/history` | Drug Transaction History |

---

# 🔐 User Roles

| Role | Responsibilities |
|------|------------------|
| Manufacturer | Register medicines & Recall |
| Distributor | Receive & transfer medicines |
| Wholesaler | Update inventory & location |
| Pharmacy | Final distributor |
| Consumer | Verify product authenticity |

---

# 💡 Key Functionalities

### Drug Registration

- Register new medicines
- Store immutable batch details
- Record manufacturer identity

---

### Ownership Transfer

- Secure transfer between stakeholders
- Blockchain transaction recording
- Full ownership traceability

---

### Location Tracking

- Update current location
- Real-time visibility across the supply chain

---

### Drug History

Retrieve complete lifecycle including

- Registration
- Ownership transfers
- Location updates
- Blockchain transaction history

---

# 🔒 Security Features

- JWT Authentication
- Hyperledger Fabric Identity Management
- Certificate Authority Authentication
- Immutable Ledger Records
- Permissioned Blockchain Network
- Role-Based Authorization

<!---

# 📷 Screenshots

Add screenshots here after uploading images.

Example

```
screenshots/

login.png

dashboard.png

register-drug.png

drug-history.png

transfer-ownership.png
```

Then display them like:

```markdown
## Login

![Login](screenshots/login.png)

## Dashboard

![Dashboard](screenshots/dashboard.png)
```

--->

# 🎯 Future Enhancements

- QR Code Verification
- Barcode Scanning
- Email Notifications
- Blockchain Analytics Dashboard
- Mobile Application
- IoT Integration
- Temperature Monitoring
- Cloud Deployment
- Multi-Organization Expansion

---

# 👨‍💻 Author

## L L Chethan

**B.Tech Computer Science and Engineering**

PES University

GitHub

https://github.com/Chethan-png

---

# ⭐ If you found this project useful, consider giving it a star!
