# 💳 INSY7314 POE — Secure Banking App

## 🧾 Overview  
A secure, banking-style web application built with the **MERN stack** (MongoDB, Express, React, Node.js).  
Implements authentication, multi-factor authentication (MFA), payment management, and strong security best practices throughout.

---

## ✅ What’s Done

### 🧩 Backend (Node.js + Express)

- **Authentication System**
  - User registration, login, and logout using **JWT**
  - **Password hashing** implemented with bcrypt
  - **Multi-Factor Authentication (MFA)** using **TOTP** and **backup codes**

- **Payment Features**
  - Endpoints to **create payments** and **view payment history**
  - Payments automatically start with a **“pending”** status

- **Security Enhancements**
  - Full input validation on all routes
  - **Rate limiting** to prevent brute-force and DDoS attacks
  - **CORS** properly configured
  - Secure **MongoDB** database connection
  - User registration, login, and logout using **JWT**  
  - **Password hashing** with bcrypt for secure storage  
  - **Multi-Factor Authentication (MFA)** implemented with **TOTP** and **backup codes**

- **Payment Features**
  - Endpoints for creating payments and viewing payment history  
  - Payments are automatically initialized with a **“pending”** status  

- **Security Enhancements**
  - Input validation on all routes  
  - **Rate limiting** to prevent brute-force and DDoS attacks  
  - **CORS** properly configured  
  - Secure **MongoDB** database connection  
  - Full **HTTPS** support (HTTP on port 3000, HTTPS on port 3443)

---

### 💻 Frontend (React)

- **User Interface**
  - Professional **banking-style dashboard**
  - Complete **login** and **registration** forms with validation
  - **Payment creation form** with all required fields:
    - Amount, currency, provider, recipient details, SWIFT code
  - **Payment history page** for viewing previous transactions
  - **Settings page** with **dark mode toggle**

- **Navigation & Security**
  - **Protected routes** for authenticated users
  - All API calls made securely **over HTTPS**
  - Professional, **banking-style dashboard**
  - Complete **login** and **registration** forms with validation  
  - **Payment creation form** including all required fields:
  - Amount, currency, provider, recipient details, SWIFT codes  
  - **Payment history page** to view previous transactions  
  - **Settings page** with a **dark mode toggle**  

- **User Experience**
  - Secure **protected routes** and authenticated navigation  
  - All API requests made **exclusively over HTTPS**

---

### 🔒 Security Implementation

- **Session Management**
  - **15-minute session timeout** with proper logout invalidation
  - **15-minute session timeout** with proper logout invalidation  

- **Multi-Factor Authentication**
  - Fully functional MFA using **TOTP** and **recovery codes**

- **Data Protection**
  - Comprehensive input validation on **both frontend and backend**
  - **TLS/HTTPS encryption** throughout
  - **Rate limiting** applied to sensitive endpoints
  - Protection against **SQL/NoSQL injection**
 
### 📺 Youtube Link

- https://youtu.be/7dN4N_oiHJI 
  - Comprehensive input validation on **both frontend and backend**  
  - **TLS/HTTPS** encryption for all network communication  
  - **Rate limiting** applied to sensitive endpoints  
  - Protection against **SQL/NoSQL injection** attacks  
