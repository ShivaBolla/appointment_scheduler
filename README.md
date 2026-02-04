<<<<<<< HEAD
# appointment_scheduler
=======
# 📅 Appointment Scheduler

A modern web application for booking and managing appointments. Users can book time slots, and admins can approve or reject requests.

---

## 🚀 Quick Start

### Prerequisites

Before you begin, make sure you have:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** running locally OR a MongoDB Atlas account

### Step 1: Install Dependencies

Open your terminal in the project folder and run:

```bash
npm install
```

### Step 2: Configure Environment

The `.env.local` file is already created. Edit it if needed:

```env
MONGODB_URI=mongodb://localhost:27017/appointment-scheduler
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

> **For MongoDB Atlas:** Replace the URI with your connection string from Atlas dashboard.

### Step 3: Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**MongoDB Atlas:** No action needed, just ensure your connection string is correct.

### Step 4: Run the Application

```bash
npm run dev
```

Open your browser and go to: **http://localhost:3000**

---

## 👤 User Flow (For Regular Users)

### Step 1: Create an Account

1. Go to **http://localhost:3000**
2. Click **"Get Started"** or **"Sign In → Create one"**
3. Fill in your details:
   - Full Name
   - Email
   - Phone (optional)
   - Password (min 6 characters)
4. Click **"Create Account"**

### Step 2: Book an Appointment

1. After login, you'll see your **Dashboard**
2. Click the **"Book Appointment"** button
3. **Step 1 - Select Date & Time:**
   - Pick a date from the calendar
   - Choose duration (15 min, 30 min, 1 hour, etc.)
   - Select an available time slot (green = available)
   - Click **Continue**
4. **Step 2 - Appointment Details:**
   - Enter a title (e.g., "Consultation")
   - Add description (optional)
   - Choose type: **Online** or **Offline**
   - Click **Continue**
5. **Step 3 - Confirm:**
   - Verify your contact details
   - Review the booking summary
   - Click **"Confirm Booking"**

### Step 3: View Your Appointments

- Go to your **Dashboard** to see all your appointments
- Each appointment shows:
  - **Pending** (yellow) - Waiting for admin approval
  - **Approved** (green) - Confirmed! Check for meeting link
  - **Rejected** (red) - Not approved

### Step 4: Join a Meeting (For Online Appointments)

- Once approved, click the **"Join Meeting"** button to open the meeting link

### Step 5: Reschedule or Cancel an Appointment

**To Reschedule:**
1. Find an appointment in your **Dashboard** (Status: "Pending" or "Approved").
2. Click the **"Reschedule"** button.
3. Select a **New Date** and **Time**.
4. Enter a **Reason** and click **"Confirm Request"**.
5. Wait for Admin approval (Status: "Reschedule Requested").

**To Cancel:**
1. Find an appointment in your **Dashboard**.
2. Click the **"Cancel Request"** button.
3. Enter a **Reason** and click **"Confirm Request"**.
4. Wait for Admin approval (Status: "Cancellation Requested").

---

## 🔐 Admin Flow (For Administrators)

### Step 1: Create an Admin Account

First, register as a normal user, then update your role in MongoDB:

**Using MongoDB Compass:**
1. Open MongoDB Compass
2. Connect to your database
3. Go to `appointment-scheduler` → `users` collection
4. Find your user document
5. Change `role` from `"user"` to `"super-admin"`
6. Save

**Using MongoDB Shell:**
```javascript
use appointment-scheduler
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "super-admin" } }
)
```

### Step 2: Access Admin Dashboard

1. Login with your admin account
2. You'll be redirected to the **Admin Dashboard** automatically
3. The sidebar shows:
   - **Dashboard** - Overview & pending requests
   - **Appointments** - All appointments
   - **Blocked Slots** - Manage unavailable times

### Step 3: Approve or Reject Appointments

1. On the Dashboard, see all **Pending Requests**
2. For each request, you can:
   - **Approve** - Click "Approve", optionally add a meeting link
   - **Reject** - Click "Reject" to decline the request
3. Users will be notified of the decision

### Step 4: Manage Reschedule & Cancellation Requests

1. On the Dashboard, look for the **"Cancellation & Reschedule Requests"** section.
2. **For Rescheduling:**
   - Review the **New Date**, **New Time**, and **Reason**.
   - **Approve**: Updates the booking to the new time (Status: "Approved").
   - **Reject**: Keeps the original booking time (Status: "Approved").
3. **For Cancellations:**
   - Review the **Reason**.
   - **Approve**: Cancels the appointment (Status: "Cancelled").
   - **Reject**: Keeps the appointment active (Status: "Approved").

### Step 5: Block Unavailable Times

1. Go to **"Blocked Slots"** in the sidebar.
2. Select a **Date**, **Start Time**, and **End Time**.
3. Add a reason (e.g., "Holiday", "Lunch Break").
4. Click **"Block Slot"**. These times will no longer be available for users to book.

### Step 6: Add Meeting Link (Optional)

When approving an online appointment:
1. Click **"Approve"**
2. A popup appears asking for a meeting link
3. Paste your Google Meet/Zoom link (or leave empty)
4. Click **"Approve"**

---

## 📁 Project Structure (For Developers)

```
src/
├── app/
│   ├── api/                 # Backend API routes
│   │   ├── auth/           # Login & Register
│   │   ├── appointments/   # CRUD operations
│   │   └── slots/          # Available time slots
│   ├── dashboard/
│   │   ├── user/           # User pages
│   │   └── admin/          # Admin pages
│   ├── login/              # Login page
│   └── register/           # Register page
├── context/                # React Context (Auth)
├── lib/                    # Database & Auth helpers
└── models/                 # MongoDB schemas
```

---

## ⚙️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Check for code issues |

---

## 🎨 Features

- ✅ User registration & login
- ✅ JWT authentication
- ✅ Role-based access (User, Sub-Admin, Super-Admin)
- ✅ Book appointments with duration options
- ✅ Admin approval workflow
- ✅ Meeting link support for online appointments
- ✅ Conflict detection (no double booking)
- ✅ Modern, responsive UI

---

## 🐛 Troubleshooting

### "MongoDB connection failed"
- Make sure MongoDB is running
- Check your `MONGODB_URI` in `.env.local`

### "Invalid token" error
- Clear your browser's localStorage
- Log in again

### Can't access admin dashboard
- Make sure your user role is set to `"sub-admin"` or `"super-admin"` in the database

---

## 📝 License

MIT License - Feel free to use this project for learning or production!

##HOW TO RUN THIS PROJECT
1. Open your terminal
(if other folder inside main folder cd foldername)
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the development server
4. Open your browser and go to `http://localhost:3000`

5.SUPER ADMIN LOGIN
EMAIL: [admin@gmail.com]
PASSWORD: [123456]

USER LOGIN
EMAIL: [shiva@gmail.com]
PASSWORD: [123456]


>>>>>>> origin/master
