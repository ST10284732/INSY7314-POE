## ✅ What’s Done

### 🧩 Backend (Node.js + Express)

- **Authentication System**
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

- **Multi-Factor Authentication**
  - Fully functional MFA using **TOTP** and **recovery codes**

- **Data Protection**
  - Comprehensive input validation on **both frontend and backend**  
  - **TLS/HTTPS** encryption for all network communication  
  - **Rate limiting** applied to sensitive endpoints  
  - Protection against **SQL/NoSQL injection** attacks  
