# 💳 INSY7314 POE — Secure Banking App

## 🧾 Overview  
A secure, banking-style web application built with the MERN stack (MongoDB, Express, React, Node.js).
Implements authentication, multi-factor authentication (MFA), payment management, and strong security best practices throughout.
Now supports multiple user roles (Customer, Employee, Admin) for enhanced access control and functionality.

---

## ✅ What’s Done

### 🧩 Backend (Node.js + Express)

- **Authentication System**
  - User registration, login, and logout using **JWT**
  - **Password hashing** implemented with bcrypt
  - **Multi-Factor Authentication (MFA)** using **TOTP** and **backup codes**

- **User Roles**
  - **Customer:** Can make payments, view current and past payments, and manage beneficiaries
  - **Employee:** Can view all pending payments, update payment statuses, and review payment history (approved/denied)
  - **Admin:** Can create new users (employees, admins), and update or delete employee accounts

- **Payment Features**
  - Endpoints to **create payments** and **view payment history**
  - Payments automatically start with a **“pending”** status
  - Customers can manage beneficiaries for faster transactions

- **Security Enhancements**
  - Full input validation on all routes
  - **Rate limiting** to prevent brute-force and DDoS attacks
  - **CORS** properly configured
  - Secure **MongoDB** database connection
  - User registration, login, and logout using **JWT**  
  - **Password hashing** with bcrypt for secure storage  
  - **Multi-Factor Authentication (MFA)** implemented with **TOTP** and **backup codes**
  - Full **HTTPS** support (HTTP on port 3000, HTTPS on port 3443)

---

### 💻 Frontend (React)

- **User Interface**
  - Professional **banking-style dashboard**
  - Complete **login** and **registration** forms with validation
  - **Role-based access**: dashboard dynamically adjusts based on user role
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

- **👤 Customer Features**
  - Professional banking-style dashboard for customers
  - **Payment creation** form with required fields:
    - Amount, currency, provider, recipient details, SWIFT code
  - View payment history with live status updates (Pending, Approved, Denied)
  - **Beneficiary management:**
      - Add, edit, and delete beneficiaries for quick future transactions
   
- **🧑‍💼 Employee Features**
  - Employee dashboard displaying all pending customer payments
  - Able to review, approve, or deny payments
  - Payment history view showing all previously approved or denied transactions
  - Search and filter functionality to locate payments easily
 
- **🧑‍💻 Admin Features**
  - Admin dashboard to view all existing users and their roles
  - Create new users (Employees, Admins)
  - Update or delete employee accounts

- **⚙️ Shared Features (All Roles)**
  - Login and registration with input validation
  - Role-based dashboard navigation, users only see pages they are authorized to access
  - Settings page with dark mode toggle
  - Protected routes ensuring only authenticated users access the dashboard
  - All API calls made securely over HTTPS
  - Modern and responsive UI for seamless user experience

 ---

### 🔒 Security Implementation

- **Session Management**
  - **15-minute session timeout** with proper logout invalidation

- **Multi-Factor Authentication**
  - Fully functional MFA using **TOTP** and **recovery codes**

- **Data Protection**
  - Comprehensive input validation on **both frontend and backend**
  - **TLS/HTTPS encryption** throughout
  - **Rate limiting** applied to sensitive endpoints
  - Protection against **SQL/NoSQL injection**
 
- **🐳 Dockerization**
  - Docker Compose Setup
    - Backend, frontend, and database all containerized
    - Simplifies deployment and ensures consistent environment configuration across systems
    - Secure communication enabled through SSL in Docker environment
   
- **🧠 Part 2 Feedback Improvements **
  - SSL Integration
    - In Part 2, SSL was only applied to the backend
    - Now fully integrated with both backend and frontend for complete HTTPS coverage
 
### 📺 Youtube Link
Part 2:
- https://youtu.be/7dN4N_oiHJI 
  - Comprehensive input validation on **both frontend and backend**  
  - **TLS/HTTPS** encryption for all network communication  
  - **Rate limiting** applied to sensitive endpoints  
  - Protection against **SQL/NoSQL injection** attacks
 
Final:
- https://www.youtube.com/watch?v=y8wPh_CXNQM
  - Comprehensive input validation on **both frontend and backend**  
  - **TLS/HTTPS** encryption for all network communication  
  - **Rate limiting** applied to sensitive endpoints  
  - Protection against **SQL/NoSQL injection** attacks  
