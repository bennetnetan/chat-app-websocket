<template>
  <div class="chat-app bg-gradient-to-br from-blue-50 to-white h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-blue-600 text-white p-4 flex items-center justify-between shadow-md">
      <h1 class="text-2xl font-bold">LAN Chat</h1>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 rounded-full animate-pulse" :class="connected ? 'bg-green-400' : 'bg-red-400'"></div>
        <span class="text-sm">{{ connected ? 'Online' : 'Offline' }}</span>
      </div>
    </header>

    <!-- Chat Area -->
    <main class="flex-grow p-6 overflow-y-auto space-y-4 bg-white">
      <div v-for="(msg, index) in messages" :key="index" class="flex items-end"
        :class="msg.userId === userId ? 'justify-end' : 'justify-start'">
        <div :class="[
          'flex flex-col max-w-xs p-4 rounded-2xl shadow-md',
          msg.userId === userId ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-900 rounded-bl-none'
        ]" :style="{ backgroundColor: msg.userId === userId ? msg.color : '' }">
          <span class="text-xs font-semibold mb-1 opacity-75">
            {{ msg.userId === userId ? 'You' : msg.userId }}
          </span>
          <span class="text-sm break-words">{{ msg.text }}</span>
        </div>
      </div>
    </main>

    <!-- Input Section -->
    <footer class="p-4 bg-gray-50 border-t flex items-center space-x-2">
      <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Type your message..."
        class="flex-grow rounded-full px-4 py-3 text-sm border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm" />
      <button @click="sendMessage"
        class="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        Send
      </button>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { openDB } from 'idb';

const newMessage = ref('');
const messages = ref([]);
const connected = ref(false);
const userId = `user-${Math.random().toString(36).substr(2, 9)}`;
const userColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

let socket = null;
let db = null;

async function initDB() {
  db = await openDB('chat-app', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('messages')) {
        db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

async function loadMessages() {
  const tx = db.transaction('messages', 'readonly');
  const store = tx.objectStore('messages');
  messages.value = await store.getAll();
}

async function saveMessageToDB(message) {
  const tx = db.transaction('messages', 'readwrite');
  const store = tx.objectStore('messages');
  await store.add(message);
}

async function deleteOldMessages() {
  const tx = db.transaction('messages', 'readwrite');
  const store = tx.objectStore('messages');
  const allMessages = await store.getAll();
  const now = Date.now();
  for (const msg of allMessages) {
    if (now - msg.timestamp > 30 * 60 * 1000) {
      await store.delete(msg.id);
    }
  }
}

onMounted(async () => {
  await initDB();
  await loadMessages();
  setInterval(deleteOldMessages, 60 * 1000);

  socket = new WebSocket('ws://localhost:3000');
  socket.onopen = () => (connected.value = true);
  socket.onmessage = async event => {
    const data = JSON.parse(event.data);
    messages.value.push(data);
    await saveMessageToDB(data);
  };
  socket.onclose = () => (connected.value = false);
});

onBeforeUnmount(() => {
  socket?.close();
});

async function sendMessage() {
  if (newMessage.value.trim() && connected.value) {
    const message = {
      text: newMessage.value,
      userId,
      color: userColor,
      timestamp: Date.now(),
    };
    socket.send(JSON.stringify(message));
    messages.value.push(message);
    await saveMessageToDB(message);
    newMessage.value = '';
  }
}
</script>

<style scoped>
/* Smooth scrollbar for chat window */
main::-webkit-scrollbar {
  width: 8px;
}

main::-webkit-scrollbar-thumb {
  background-color: rgba(100, 116, 139, 0.4);
  border-radius: 10px;
}
</style>
