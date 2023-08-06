/*class Snake {
    constructor(ctx, segmentSize, startX, startY, xfood, yfood, scorefood) {
      this.ctx = ctx;
      this.segmentSize = segmentSize;
      this.segments = [
        { x: startX, y: startY }
      ];
      this.direction = { x: 1, y: 0 };
      this.eatFood = false;
      this.food = [
        { x: xfood, y: yfood, score: scorefood}
      ];
      this.canvasWidth = 800;
      this.canvasHeight = 600;
      this.score = 0;
      this.gameover = false;
    }
    checkCollision(){
      for (let i=1;i<this.segments.length;i++)
      {
        if ((this.segments[0].x == this.segments[i].x) && (this.segments[0].y == this.segments[i].y))
        {
          return true;
        }
      }
      if (this.segments[0].x < 0 || this.segments[0].x >= this.canvasWidth || this.segments[0].y<0 || this.segments[0].y>=this.canvasHeight)
      {
        return true;
      }
      return false;
    }
    checkCollisionWithFood(){
      for (let i=0;i<this.food.length;i++)
      {
        if ((this.food[i].x == this.segments[0].x) && (this.food[i].y == this.segments[0].y))
        {
          this.eatFood = true;
          this.score += this.food[i].score;
          return;
        }
      }
      return;
    }
    move() {
      const head = { ...this.segments[0] };
      head.x += this.direction.x * this.segmentSize;
      head.y += this.direction.y * this.segmentSize;
      if (this.checkCollision())
      {
        console.log("perdiste");
        this.gameover=true;
      }
      this.checkCollisionWithFood();
      //head.score = (this.segments.length - 4);
      //ver como solucionar que si no es un nuevo puntaje alto (es decir, no comio una comida) 
      this.segments.unshift(head); // Agregar la nueva cabeza al inicio
      // Eliminar el último segmento si no se ha comido algo
      if (!this.eatFood) {
        this.segments.pop();
      } else { // entonces, si se comió la comida...
        this.eatFood = false;
        this.food.pop();
        this.generateFood();
      }
    }
    getRandomCoordinate(max) {
      return Math.floor(Math.random() * max / 10) * 10;
    }
    generateFood(){
      const foodX = this.getRandomCoordinate(this.canvasWidth);
      const foodY = this.getRandomCoordinate(this.canvasHeight);
      const scoreFood = Math.floor(Math.random()*5) + 1;

      let newFood = { x: foodX, y: foodY , score: scoreFood};
      
      this.food.unshift(newFood);
    }
    changeDirection(newDirection) {
      // Evitar cambiar la dirección opuesta
      if (
        (newDirection.x === 1 && this.direction.x === -1) ||
        (newDirection.x === -1 && this.direction.x === 1) ||
        (newDirection.y === 1 && this.direction.y === -1) ||
        (newDirection.y === -1 && this.direction.y === 1)
      ) {
        return;
      }
      this.direction = newDirection;
    }
    ateFood() {
      this.eatFood = true;
    }
    draw() {
      this.drawGrid();
      this.segments.forEach((segment, index) => {
        this.ctx.fillStyle = index === 0 ? 'red' : 'green';
        this.ctx.fillRect(segment.x, segment.y, this.segmentSize, this.segmentSize);
        
      });
      this.food.forEach((segment, index) => {
        this.ctx.fillStyle ='magenta';
        this.ctx.fillRect(segment.x, segment.y, this.segmentSize, this.segmentSize);
      });
    }
  }*/
const Pscore = document.getElementById("score");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gameOverScreen = document.getElementById('gameOverScreen');
const scoreDisplay = document.getElementById('scoreDisplay');
const restartButton = document.getElementById('restartButton');
const joinButton = document.getElementById('joinButton');

const waitingSpan = document.getElementById('waitingSpan');

let score = 0;
let gameOver = false;
let lastTimestamp = 0;
const segmentSize = 10;
const startX = 100;
const startY = 100;
const delay = 70;

let snake;

function drawGrid() {
  ctx.strokeStyle = '#000'; // Color de las líneas de la cuadrícula
 
  // Dibujar líneas verticales
  for (let x = 0; x <= canvas.width; x += segmentSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Dibujar líneas horizontales
  for (let y = 0; y <= canvas.height; y += segmentSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

// Función para mostrar la pantalla de Game Over
function showGameOverScreen() {
  gameOverScreen.classList.remove('hidden');
  scoreDisplay.textContent = `Score: ${snake.score}`;
}

// Función para ocultar la pantalla de Game Over
function hideGameOverScreen() {
  gameOverScreen.classList.add('hidden');
}

function updateScoreDisplay() {
  // Actualizar el contenido del elemento HTML con el valor del score
  Pscore.textContent = `Score: ${snake.score}`;
}



function drawPlayers(){
  for(let i=0 ;i<players.length;++i){
    players[i].draw();
  }
}

function gameLoop(timestamp) {
  // Calcular el tiempo transcurrido desde el último frame
  const deltaTime = timestamp - lastTimestamp;
  /*if (snake.gameover) {
    cancelAnimationFrame(gameLoop);
    showGameOverScreen();
    return;
  }*/
  // Verificar si ha pasado suficiente tiempo para mover el Snake
  if (deltaTime >= delay) {
      // Borrar el canvas    
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid();
      drawPlayers();

      // Actualizar y dibujar el snake
      /*snake.move();
      snake.draw();*/
      updateScoreDisplay();

      lastTimestamp = timestamp; // Actualizar el último timestamp
  }
  requestAnimationFrame(gameLoop); // Continuar el bucle del juego
}

// Función para mostrar los nombres de los jugadores y actualizar sus puntajes
function updatePlayerList(players) {
  const playerList = document.getElementById('playerList');

  // Limpiamos la lista antes de actualizarla para evitar duplicados
  playerList.innerHTML = '';

  // Agregamos cada jugador como un elemento de lista en la columna
  players.forEach((player) => {
    const listItem = document.createElement('li');
    listItem.textContent = `${player.name}: ${player.score}`;
    playerList.appendChild(listItem);
  });
}

// Agregar el evento para capturar las teclas del teclado
document.addEventListener('keydown', handleKeyPress);

const socket = io();

// Cuando el jugador se conecte al servidor
socket.on('connect', () => {
  console.log('Conectado al servidor:', socket.id);
});

// Escuchamos el evento "updatePlayers" del servidor para recibir información de los jugadores
socket.on('updatePlayers', (players) => {
  if (players.length === 3) {
    waitingSpan.classList.add('hidden');
  } else {
    waitingSpan.classList.remove('hidden');
  }
  updatePlayerList(players);
});

// Escuchar el evento 'gameStart' para actualizar la interfaz cuando la partida comienza
socket.on('gameStart', (players, food) => {
  try {
    console.log('La partida ha comenzado');
    // Aquí puedes realizar las actualizaciones de la interfaz para mostrar que el juego ha comenzado
    for (let i=0; i<players.length; i++){
      if (players[i].id === socket.id){
        snake = new Snake(ctx, socket.id, players[i].name, players[i].segmentSize, players[i].segments[0].x, players[i].segments[0].y, players[i].direction.x, players[i].direction.y, players[i].gameboard);
      }
    }
    //requestAnimationFrame(gameLoop);
  } catch (error) {
    console.error('Error en la lógica del evento gameStart:', error);
  }
  // Aquí puedes realizar las actualizaciones de la interfaz para mostrar que el juego ha comenzado
});

// Escuchar el evento 'countdown' para mostrar el contador regresivo antes del inicio del juego
socket.on('countdown', (count) => {
  try {
    console.log(`La partida comenzará en ${count} segundos`);
  } catch (error) {
    console.error('Error en la lógica del evento countdown:', error);
  }
  // Aquí puedes realizar las actualizaciones de la interfaz para mostrar el contador regresivo
});

// Evento para reiniciar el juego cuando se haga clic en el botón "Restart"
restartButton.addEventListener('click', () => {
  // Aquí puedes reiniciar las variables del juego y comenzar nuevamente
  hideGameOverScreen();
  score = 0;
  gameOver = false;
});

// Función para capturar las teclas del teclado
function handleKeyPress(event) {
    const key = event.keyCode;
    // Mover hacia la izquierda (flecha izquierda)
    if ((key >= 37) && (key <= 40)){
      //socket.emit('newMove', { key });
      //snake.changeDirection({ x: -1, y: 0 });
    }
}

// Capturamos el formulario y el campo de entrada
const joinForm = document.getElementById('joinForm');
const usernameInput = document.getElementById('username');

// Manejamos el evento de envío del formulario
joinForm.addEventListener('submit', (event) => {
  event.preventDefault(); // Evitamos el comportamiento predeterminado del formulario (recargar la página)

  const username = usernameInput.value; // Obtenemos el nombre del usuario del campo de entrada
  if (username.trim() !== '') {
    // Si el nombre no está vacío, enviamos la solicitud al servidor
    socket.emit('joinGame', { username });
    console.log('se emitió joinGame');
    joinForm.style.display = 'none'; // Ocultamos el formulario después de unirse

    waitingSpan.classList.remove('hidden');
  }
});



// Iniciar el bucle del juego
//requestAnimationFrame(gameLoop);