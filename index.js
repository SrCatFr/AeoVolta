const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const SocketManager = require('./src/server/SocketManager');
const MatchMaking = require('./src/game/MatchMaking');

// Configuración básica
app.use(express.static(path.join(__dirname, 'src/public')));

// Inicializar gestores
const matchMaking = new MatchMaking();
new SocketManager(io, matchMaking);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`AeoVolta server running on port ${PORT}`);
});
