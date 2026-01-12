const socket = io();
let currentRoom = null;
let username = null;

const roomsEl = document.getElementById('rooms');
const usersListEl = document.getElementById('usersList');
const messagesEl = document.getElementById('messages');
const currentRoomEl = document.getElementById('currentRoom');
const statusEl = document.getElementById('status');

const newRoomInput = document.getElementById('newRoomInput');
const createRoomBtn = document.getElementById('createRoomBtn');
const usernameInput = document.getElementById('usernameInput');
const joinBtn = document.getElementById('joinBtn');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');

const messageTpl = document.getElementById('messageTpl');

function renderRooms(list){
  roomsEl.innerHTML = '';
  list.forEach(r => {
    const li = document.createElement('li');
    li.textContent = r;
    li.style.cursor = 'pointer';
    li.onclick = () => {
      selectRoom(r);
    };
    roomsEl.appendChild(li);
  });
}

function selectRoom(r){
  const prev = document.querySelector('#rooms li.selected');
  if(prev) prev.classList.remove('selected');
  const items = [...roomsEl.querySelectorAll('li')];
  const found = items.find(i=>i.textContent===r);
  if(found) found.classList.add('selected');
  currentRoom = r;
  currentRoomEl.textContent = 'Room: ' + r;
  statusEl.textContent = 'Not joined — enter username and click Join';
}

createRoomBtn.onclick = () => {
  const name = newRoomInput.value.trim();
  if(!name) return alert('Enter a room name');
  socket.emit('createRoom', name, (res) => {
    if(res.ok){
      newRoomInput.value = '';
      socket.emit('getRooms');
      selectRoom(res.room);
    } else {
      alert(res.error || 'Could not create room');
    }
  });
};

joinBtn.onclick = () => {
  if(!currentRoom) return alert('Select a room first');
  const name = usernameInput.value.trim();
  if(!name) return alert('Enter username');
  socket.emit('joinRoom', {room: currentRoom, username: name}, (res) => {
    if(!res.ok){
      alert(res.error || 'Could not join');
      return;
    }
    username = name;
    statusEl.textContent = 'Joined';
    usersListEl.innerHTML = '';
    res.users.forEach(u => {
      const li = document.createElement('li'); li.textContent = u; usersListEl.appendChild(li);
    });
    messagesEl.innerHTML = '';
    res.messages.forEach(m => appendMessage(m, false));
    scrollToBottom();
  });
};

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if(!text) return;
  if(!currentRoom || !username) return alert('Join a room first');
  socket.emit('sendMessage', {room: currentRoom, text});
  messageInput.value = '';
});

socket.on('roomsList', (list) => {
  renderRooms(list);
});

socket.on('userList', (users) => {
  usersListEl.innerHTML = '';
  users.forEach(u => {
    const li = document.createElement('li'); li.textContent = u; usersListEl.appendChild(li);
  });
});

socket.on('systemMessage', (txt) => {
  appendSystemMessage(txt);
  scrollToBottom();
});

socket.on('newMessage', (m) => {
  appendMessage(m, false);
  // desktop/mobile notification
  if (document.hidden || m.username !== username) {
    // small visual cue
    statusEl.textContent = 'New message';
    setTimeout(()=>{ if (statusEl.textContent === 'New message') statusEl.textContent = 'Joined'; }, 2000);
  }
  scrollToBottom();
});

function appendSystemMessage(text){
  const div = document.createElement('div');
  div.className = 'message system';
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = 'System';
  const txt = document.createElement('div');
  txt.className = 'text';
  txt.textContent = text;
  div.appendChild(meta);
  div.appendChild(txt);
  messagesEl.appendChild(div);
}

function appendMessage(m, highlight){
  const el = messageTpl.content.cloneNode(true);
  const container = el.querySelector('.message');
  const userEl = el.querySelector('.user');
  const timeEl = el.querySelector('.time');
  const textEl = el.querySelector('.text');

  userEl.textContent = m.username;
  timeEl.textContent = (new Date(m.ts)).toLocaleString();
  textEl.innerHTML = formatText(m.text);

  if(m.username === username) container.classList.add('you');
  messagesEl.appendChild(el);
}

function formatText(text){
  // very small formatting: **bold**, *italic*, links
  let out = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  // basic escaping for safety
  return out;
}

function scrollToBottom(){
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// request rooms on load
socket.emit('getRooms');
