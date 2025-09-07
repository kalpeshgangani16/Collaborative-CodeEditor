# 🖥️ Real-Time Collaborative Coding App

![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socket.io&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)


👨‍💻 **Welcome, Code Wizard!** Collaborate in real-time, create rooms, and code together with friends or colleagues. Perfect for pair programming and coding interviews.  

---

## 🚀 Features

- **User Authentication:** Login & registration flow with secure password handling  
- **Room Management:** Create or join rooms using a unique Room ID  
- **Real-Time Collaboration:** Live code updates for all participants using Socket.IO  
- **Code Editor:** Integrated Monaco Editor with syntax highlighting  
- **User Feedback:** Clear error & success messages, plus loading indicators  
- **Fun UI:** Welcome banner for coders and responsive forms  

---

## 📂 Project Structure

- src/
  - components/
    - CreateRoomForm.js  
    - LoginForm.js  
    - RoomPage.js  
  - styles/
    - index.css  
    - LoginForm.module.css  
  - App.js  
  - index.js  
- backend/
  - server.js  
  - models/
    - User.js  
    - Room.js  
  - routes/
    - authRoutes.js  
    - roomRoutes.js  
  - middleware/
    - auth.js  
- .env  
- package.json  
- README.md  

---

## ⚙️ Installation

1. **Clone the repository:**  
   git clone https://github.com/your-username/collab-coding-app.git  
   cd collab-coding-app

2. **Install frontend dependencies:**  
   npm install

3. **Start frontend:**  
   npm start  

Open in browser: http://localhost:3000

---

## 🔌 Backend Setup

1. **Navigate to backend folder:**  
   cd backend  
   npm install

2. **Create `.env` file** with the following values:  
   PORT=5000  
   MONGO_URI=your_mongo_connection_string  
   JWT_SECRET=your_secret_key

3. **Start backend server:**  
   npm run dev

---

## 📝 Usage

1. **Create a Room**  
   - Enter username, password, and room name  
   - If user doesn’t exist, register when prompted  

2. **Join a Room**  
   - Enter username, password, and Room ID  
   - Collaborate live with others  

3. **Code Together!**  
   - See real-time updates in the editor  
   - Share Room ID with friends to join  

---

## 🎨 Frontend Highlights

- React with **CSS Modules**  
- Live **Monaco Editor** for coding  
- Responsive **forms and banners**  
- Fun welcome messages for users  

---

## 🛠️ Future Improvements

- Display list of users inside a room  
- Support multiple programming languages  
- Persistent code storage on server  
- Dark/light mode toggle  
- Live code execution in editor  

---

## 💻 Screenshots

  

---

## 📜 License

MIT License © 2025 — Developed by **Kalpesh**
