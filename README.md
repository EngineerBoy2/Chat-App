# Chat Application

This project is a simple real-time chat application built with Node.js, Express and Socket.IO.
It satisfies the project brief: real-time messaging, room creation/joining, username selection,
message timestamps, basic formatting (**bold**, *italic*, links), user lists and room management.

## Files
- server.js - Node/Express server and Socket.IO
- package.json - dependencies and start script
- public/index.html - client HTML
- public/style.css - styles
- public/chat.js - client JS
- README.md - this file

## Prerequisites
- Node.js (v14 or later recommended) installed on your machine.
- npm (comes with Node.js)

## Run locally
1. Extract the `chat_app.zip` folder.
2. Open terminal/command prompt inside the extracted folder.
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```
5. Open your browser and go to: `http://localhost:3000`
6. Create a room, choose a username and join. Open the same URL in another tab/window or different device on the same network to test real-time messaging.

## Notes & Security
- This demo stores room and user state in-memory and is intended for learning/demo only.
- For production use: add persistent storage, authentication, input sanitization, HTTPS and rate-limiting.

