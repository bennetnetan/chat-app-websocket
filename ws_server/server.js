const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    console.log('A user connected.');

    ws.on('message', message => {
        console.log(`Received: ${message}`);
        // Broadcast to all connected clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('A user disconnected.');
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://192.168.0.100:3000');
});
