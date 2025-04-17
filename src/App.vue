<template>
  <div class="chat-app">
    <h1>LAN Chat App</h1>
    <div :class="['status', { connected }]"></div>
    <div class="chat-box">
      <div v-for="(msg, index) in messages" :key="index" class="message">{{ msg }}</div>
    </div>
    <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Type a message..." />
    <button @click="sendMessage">Send</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const newMessage = ref('');
const messages = ref([]);
const connected = ref(false);

let socket = null;

onMounted(() => {
  socket = new WebSocket('ws://localhost:3000');

  socket.onopen = () => {
    connected.value = true;
  };

  socket.onmessage = event => {
    messages.value.push(event.data);
  };

  socket.onclose = () => {
    connected.value = false;
  };
});

onBeforeUnmount(() => {
  socket && socket.close();
});

function sendMessage() {
  if (newMessage.value.trim() !== '' && connected.value) {
    socket.send(newMessage.value);
    newMessage.value = '';
  }
}
</script>

<style>
.chat-app {
  max-width: 400px;
  margin: 2rem auto;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 10px;
  font-family: Arial, sans-serif;
}

.status {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  margin-bottom: 10px;
  background: red;
}

.status.connected {
  background: green;
}

.chat-box {
  border: 1px solid #eee;
  height: 200px;
  overflow-y: auto;
  margin-bottom: 10px;
  padding: 5px;
  background: #f9f9f9;
}

.message {
  margin-bottom: 5px;
}

input {
  width: calc(100% - 70px);
  padding: 5px;
}

button {
  padding: 5px 10px;
  margin-left: 5px;
}
</style>
