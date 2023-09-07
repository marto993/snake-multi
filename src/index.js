require('dotenv').config();
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const Snake = require('../public/snakeClass.js');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = process.env.PORT || 3000;
const canvasWidth = 1000;
const canvasHeight = 600;
const segmentSize = 10;
const diff = 100;

// Configuración para servir archivos estáticos desde el directorio "public" (donde estará tu index.html)
app.use(express.static('public'));

let playing = false;
let timeoutIdStartGame = 0;
let downCounter = 3;
let intervalId = 0;
let maxPlayers = 2;
let players = [];
let gameboard = []; // acá guardo las posiciones de todo en el mapa pero sin tener en cuenta el x10 del ancho del snake.
let food = {x: getRandomCoordinate(canvasWidth),
            y: getRandomCoordinate(canvasHeight),
            score: (Math.floor(Math.random()*9) + 1)};

function resetGameBoard() {
  for(let i=0; i<(canvasWidth/segmentSize); ++i){
    gameboard[i] = []; // Inicializar cada fila como un arreglo vacío
    for (let j=0; j<(canvasHeight/segmentSize); ++j){
      gameboard[i][j] = 0;
    }
  }
}
resetGameBoard();
function updateGameBoard() {
  resetGameBoard();
  players.forEach((Player, index) => {
    Player.segments.forEach((P, I) => {
      gameboard[(P.x/segmentSize)][(P.y/segmentSize)] = 1;
    });
  });
  let foodX = food.x / segmentSize;
  let foodY = food.y / segmentSize;
  gameboard[foodX][foodY] = 2;
}

function getRandomCoordinate(max) {
  return Math.floor(Math.random() * max / segmentSize) * segmentSize;
}
function verifyCoordinate(x,y) {
  try {
    if (x < 0 || (x >= (canvasWidth/segmentSize)) || y < 0 || (y >= (canvasHeight/segmentSize))) {
      return false;
    }
    return gameboard[x/segmentSize][y/segmentSize] === 0;
  } catch (error) {
    console.error('-->',error);
  }
}
function generateFood() {
  let foodX;
  let foodY;
  do {
    foodX = getRandomCoordinate(canvasWidth);
    foodY = getRandomCoordinate(canvasHeight);
  } while (verifyCoordinate(foodX, foodY));
  const scoreFood = Math.floor(Math.random()*9) + 1;
  let newFood = { x: foodX, y: foodY , score: scoreFood };
  food = newFood;
}

io.on('connection', (socket) => {
  console.log('Nuevo jugador conectado:', socket.id);
  try {
    socket.on('testLatency', ( data ) => {
      const serverTime = performance.now(); // Tiempo del servidor en milisegundos
      const diffserverTime = Math.round(serverTime - data.startTime);

      // Emitir la respuesta de latencia al cliente
      socket.emit('latencyResponse', { diffserverTime, serverTime });
    });
  } catch (error) {
    console.error('Error intentando hacer prueba de rendimiento; ',error);
  }
  
  function gameLoop() {
    let numPlayers = players.length;
    players.forEach((Player, index) => {
      Player.move();
      let headX = Player.segments[0].x / segmentSize;
      let headY = Player.segments[0].y / segmentSize;
      if (headX < 0 || (headX >= (canvasWidth/segmentSize)) || headY < 0 || (headY >= (canvasHeight/segmentSize))) {
        Player.GameOver();
        numPlayers--;
        //headX = 0;
      } else {
        if (gameboard[headX][headY] === 1) {
          Player.GameOver();
          numPlayers--;
        }
        if (gameboard[headX][headY] === 2) {
          Player.EatFood(food.score);
          generateFood();
        }
      }
      updateGameBoard();
    });
    //updateGameBoard();
    io.emit('gameFrame', players, food);
    if (numPlayers === 0){
      resetGameBoard();
      playing = false;
      downCounter = 3;
      players = [];
      clearInterval(intervalId);// Detener el bucle de movimiento del personaje
    }
  }

  function startGame() {
    if (downCounter === 0){
      resetGameBoard();

      clearTimeout(timeoutIdStartGame);
      playing = true; // La partida ha comenzado
      console.log(`Comenzando la partida!`);
      
      io.emit('gameStart', players, food, canvasWidth, canvasHeight, segmentSize); 
      intervalId = setInterval(gameLoop, diff);

    } else {
      console.log(`Comenzando el contador regresivo: ${downCounter}`);
      io.emit('countdown', downCounter); // Emitir el evento 'countdown' con el contador a todos los jugadores
      downCounter--;
      timeoutIdStartGame = setTimeout(startGame, 1000);
    }
  }

  socket.on('newMove', (data) => {
    // primero tengo que saber qué usuario ha enviado el 'newMove'
    let playerToMove = players.find(player_ => player_.id === socket.id);
    
    if (data.key === 37) {
      playerToMove.changeDirection({ x: -1, y: 0 });
    }
    // Mover hacia la derecha (flecha derecha)
    else if (data.key === 39) {
      playerToMove.changeDirection({ x: 1, y: 0 });
    }
    // Mover hacia arriba (flecha arriba)
    else if (data.key === 38) {
      playerToMove.changeDirection({ x: 0, y: -1 });
    }
    // Mover hacia abajo (flecha abajo)
    else if (data.key === 40) {
      playerToMove.changeDirection({ x: 0, y: 1 });
    }
  });

  // Manejamos el evento "joinGame" enviado por el cliente
  socket.on('joinGame', (data) => {
    // Resto de la lógica para manejar la unión del jugador a la partida ...
    const username = data.username;

    // Creamos un nuevo objeto de jugador con el nombre y el puntaje inicial
    let newX, newY;
    do {
      newX = getRandomCoordinate(canvasWidth);
      newY = getRandomCoordinate(canvasHeight);
    } while (verifyCoordinate(newX, newY));
    let player = new Snake(socket.id, username, segmentSize, canvasWidth, canvasHeight, newX, newY, 1, 0);

    // Agregamos al jugador a la lista de jugadores
    if (players.length < maxPlayers) {
      players.push(player);
      io.emit('updatePlayers', players);
      console.log(`El jugador "${username}" se ha unido a la partida.`);
    } 
    // Comprobar si hay suficientes jugadores para comenzar la partida
    if (players.length === maxPlayers && !playing) {
      timeoutIdStartGame = setTimeout(startGame, 1000);
    }
  });

  // Manejamos la desconexión de un jugador
  socket.on('disconnect', () => {
    // Resto de la lógica para manejar la desconexión del jugador ...

    // Detener el contador regresivo si un jugador se desconecta y no hay suficientes jugadores
    if (players.length < maxPlayers && timeoutIdStartGame) {
      clearTimeout(timeoutIdStartGame);
    }
  });
});

server.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});