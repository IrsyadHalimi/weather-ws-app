require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

// Simpan Websocket Clients
const clients = new Set();

// Inisialisasi server websocket
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  console.log('Client Connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('Clients disconnected');
    clients.delete(ws);
  });
});

// Mengambil data
const fetchWeatherData = async (city = 'London') => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    return { error: 'Unable to fetch weather data' };
  }
};

// Kirim data ke semua client websocket
const broadcastWeatherData = async (city) => {
  const data = await fetchWeatherData(city);
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Endpoint API koneksi websocket
app.use(express.static('public')); // Opsional untuk file frontend
app.get('/ws', (req, res) => {
  res.status(426).send('Use Websocket for real-time data');
});

// Setup HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Integrasi websocket dengan HTTP server
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

const CITY = 'London';
setInterval(() => broadcastWeatherData(CITY), 100000);
