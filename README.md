---

# Ether Wallet Backend

This project is a backend service for a secure Ethereum wallet. It includes features such as user registration, wallet management, encryption of private keys, and sending Ether. The system uses **random generation** for both encryption secrets and JWT tokens, with **key rotation** for enhanced security. It also uses **JWT-based authentication** to protect sensitive routes.

## Features

- **User Registration & Login**: Users can register and log in with their credentials.
- **Random Key Generation**: Encryption secrets and JWT tokens are generated randomly for each user.
- **Key Rotation**: Both private key encryption secrets and JWT secrets rotate automatically for enhanced security.
- **Send Ether**: Allows authenticated users to send Ether transactions from their wallet.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Setup](#project-setup)
    - [1. Initialize Project](#1-initialize-project)
    - [2. Install Dependencies](#2-install-dependencies)
3. [Configuration](#configuration)
4. [Folder Structure](#folder-structure)
5. [Environment Variables](#environment-variables)
6. [Running the Application](#running-the-application)
7. [API Endpoints](#api-endpoints)
8. [Security Features](#security-features)
9. [License](#license)

---

## Tech Stack

- **Node.js**: Server-side JavaScript runtime.
- **Express**: Web framework for building the API.
- **MongoDB & Mongoose**: Database for storing user data and encrypted keys.
- **Ethereum (ethers.js)**: Interacting with Ethereum blockchain.
- **JSON Web Tokens (JWT)**: Authentication and token generation.
- **Crypto**: For encryption/decryption of private keys.
- **Bcryptjs**: Password hashing.
- **Dotenv**: For environment variable management.
- **TypeScript**: For strong typing and enhanced developer experience.

---

## Project Setup

### 1. Initialize Project

Start by creating a new directory for your project, initializing a Node.js project, and installing dependencies:

```bash
mkdir ether-wallet-backend
cd ether-wallet-backend
npm init -y
```

### 2. Install Dependencies

Install the required dependencies:

```bash
npm install express mongoose dotenv bcryptjs jsonwebtoken ethers crypto body-parser cors
npm install typescript @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/cors @types/body-parser --save-dev
```

---

## Configuration

Create a `.env` file in the root directory with the following configuration:

```env
MONGO_URI=mongodb://localhost:27017/ether_wallet
INFURA_URL=https://mainnet.infura.io/v3/your_infura_project_id
JWT_ROTATE_INTERVAL=24h  # JWT rotation interval (24 hours)
ENCRYPTION_ROTATE_INTERVAL=7d  # Key rotation interval for encryption (7 days)
```

Replace `your_infura_project_id` with your actual Infura Project ID.

---

## Folder Structure

Here's how the directory structure looks:

```
ether-wallet-backend/
│
├── /backend/
│   ├── /controllers/
│   │   ├── authController.ts
│   │   └── walletController.ts
│   ├── /models/
│   │   └── User.ts
│   ├── /routes/
│   │   ├── authRoutes.ts
│   │   └── walletRoutes.ts
│   ├── /middleware/
│   │   └── authMiddleware.ts
│   ├── server.ts
├── .env
└── package.json
```

---

## Environment Variables

The `.env` file contains configuration for:

- **MONGO_URI**: Your MongoDB connection string.
- **INFURA_URL**: The URL for the Infura Ethereum node provider.
- **JWT_ROTATE_INTERVAL**: Time interval for rotating the JWT secret (default: 24 hours).
- **ENCRYPTION_ROTATE_INTERVAL**: Time interval for rotating the encryption secret (default: 7 days).

---

## Running the Application

1. **Ensure MongoDB is running** (locally or via MongoDB Atlas).
2. **Set the environment variables** in your `.env` file.
3. **Run the backend**:

```bash
tsc && node dist/server.js
```

This will start the backend server on `http://localhost:5000`.

---

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Log in and receive a JWT token.

### Wallet

- `POST /api/wallet/send`: Send Ether to another address (protected by JWT).

---

## Security Features



- **Random Secret Generation**: Both the encryption secret and JWT token secret are generated randomly for each user.
- **Key Rotation**:
    - **Encryption Keys** are rotated every 7 days.
    - **JWT Secrets** are rotated every 24 hours.
- **JWT-based Authentication**: Secures endpoints like sending Ether.

This provides enhanced security for sensitive data and operations.

---

## License

This project is licensed under the MIT License.

---
