document.addEventListener("DOMContentLoaded", function(event) {
    
  const startButton = document.getElementById('startButton');
  const latencyList = document.getElementById('latencyList');

  //const Pscore = document.getElementById("score");
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const gameOverScreen = document.getElementById('gameOverScreen');
  const scoreDisplay = document.getElementById('scoreDisplay');
  const restartButton = document.getElementById('restartButton');
  const joinButton = document.getElementById('joinButton');
  const joinForm = document.getElementById('joinForm');
  const usernameInput = document.getElementById('username');
  const waitingSpan = document.getElementById('waitingSpan');
  const playerList = document.getElementById('playerList');
  let startTime = 0;

  // Agregar el evento para capturar las teclas del teclado
  document.addEventListener('keydown', handleKeyPress);

  const socket = io();

  let scores = 0;
  let gameOver = false;
  let lastTimestamp = 0;
  let segmentSize = 20;
  const startX = 100;
  const startY = 100;
  const delay = 70;

  let snakes = [];
  let foods;
  let idPlayer = socket.id;

  // Cuando el jugador se conecte al servidor
  socket.on('connect', () => {
    console.log('Conectado al servidor:', socket.id);
  });

  /*##########################  F  U  N  C  I  O  N  E  S  ##########################*/
  function drawGrid() {
    //A398db
    ctx.strokeStyle = '#A398db3D'; // Color de las líneas de la cuadrícula
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
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(canvas.width,0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(canvas.width,0);
    ctx.lineTo(canvas.width,canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(canvas.width,canvas.height);
    ctx.lineTo(0,canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0,canvas.height);
    ctx.lineTo(0,0);
    ctx.stroke();
  }
  // Función para mostrar la pantalla de Game Over
  function showGameOverScreen() {
    gameOverScreen.classList.remove('hidden');
    /*const snakePlayer = snakes.find((snake) => snake.id === idPlayer);
    scoreDisplay.textContent = `Score: ${snakePlayer.score}`;*/
  }
  // Función para ocultar la pantalla de Game Over
  function hideGameOverScreen() {
    gameOverScreen.classList.add('hidden');
  }
  function updateScoreDisplay() {
    // Actualizar el contenido del elemento HTML con el valor del score
    /*for(let i=0 ;i<snakes.length;++i){
      if (snakes[i].id === idPlayer) {
        Pscore.textContent = `Score: ${snakes[i].score}`;
      }
    }*/
  }
  function drawPlayers(){
    let colorHeadPJ = '#000';
    for(let i=0 ;i<snakes.length;++i){
      if (!snakes[i].gameover) {
        colorHeadPJ = (snakes[i].id === socket.id) ? '#F72' : '#D0B';
        snakes[i].segments.forEach((segment, index) => {
          ctx.fillStyle = index === 0 ? colorHeadPJ : '#3A0';
          ctx.fillRect(segment.x, segment.y, segmentSize, segmentSize);
        });
      }
    }
    //ctx.fillRect(foods.x, foods.y, segmentSize, segmentSize);
    ctx.beginPath();
    ctx.arc(foods.x + (segmentSize/2), foods.y + (segmentSize/2), foods.score, 0, 2 * Math.PI);
    ctx.fillStyle = '#203';
    ctx.fill();
  }
  function checkGameOver(){
    let playerFind = snakes.find(player_ => player_.id === socket.id);
    return playerFind.gameover;
  }
  function gameLoop() {
    // Borrar el canvas    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawPlayers();
    //updateScoreDisplay();
    updatePlayerList(snakes);
    gameOver = checkGameOver();
  }
  // Función para mostrar los nombres de los jugadores y actualizar sus puntajes
  function updatePlayerList(Players) {
    playerList.innerHTML = '';

    // Agregamos cada jugador como un elemento de lista en la columna
    Players.forEach((player) => {
      const listItem = document.createElement('li');
      //listItem.textContent = `${player.name}: ${player.score}`;
      if (player.gameover){
        listItem.classList.add('gameover'); // Agregar la clase 'gameover' si el jugador ha perdido
      }

      let playerName = document.createElement('span');
      let playerScore = document.createElement('span');

      playerName.textContent = player.name;
      playerName.classList.add('player-name');

      playerScore.textContent = player.score;
      playerScore.classList.add('player-score');

      listItem.appendChild(playerName);
      listItem.appendChild(playerScore);

      playerList.appendChild(listItem);
    });
  }
  // Función para capturar el KeyPress y emitir el evento newMove si presiona ha presionado las flechas de direccion.
  function handleKeyPress(event) {
    const key = event.keyCode;
    
    if ((key >= 37) && (key <= 40) && !gameOver){ //&& snakePlayer.gameover === false){
      socket.emit('newMove', { key });      
    }
  }

  /*###############################  E S C U C H A N D O   E V E N T O S  ###############################*/
  socket.on('updatePlayers', (Players) => {
    if (Players.length === 2) {
      waitingSpan.classList.add('hidden');
    } else {
      waitingSpan.classList.remove('hidden');
    }
    updatePlayerList(Players);
    snakes = Players;

  });

  // Escuchar el evento 'gameStart' para actualizar la interfaz cuando la partida comienza
  socket.on('gameStart', (players, food, CanvasWidth, CanvasHeight, SegmentSize) => {
    try {
      console.log('La partida ha comenzado');
      canvas.width = CanvasWidth;
      canvas.height = CanvasHeight;
      segmentSize = SegmentSize;
      snakes = players;
      foods = food;
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

  socket.on('gameFrame', (players, food) => {
    try{
      latencyList.innerHTML = '';
      if (startTime != 0) // Tiempo de inicio en milisegundos)
      {
        let diffTimeGameFrame = Math.round(performance.now() - startTime);
        startTime = performance.now();
        const listItem = document.createElement('li');
        listItem.textContent = `Latencia: ${diffTimeGameFrame} ms`;
        latencyList.appendChild(listItem);
      } else {
        startTime = performance.now();// Tiempo inicial en milisegundos
      }
      snakes = players;
      foods = food;
      gameLoop();
      console.log('nuevo gameFrame!');
    } catch (error) {
      console.error("Error en la lógica del evento gameFrame:", error);
    }
  });
  // Manejar la respuesta del servidor
  /*socket.on('latencyResponse', (diffserverTime, serverTime) => {
    const endTime = performance.now(); // Tiempo de finalización en milisegundos
    const latency = Math.round((endTime - startTime)); // Calcular la latencia

    const listItem = document.createElement('li');
    listItem.textContent = `Latencia: ${latency} ms (Servidor: ${diffserverTime} ms)`;
    latencyList.appendChild(listItem);
  });*/

  // Evento para reiniciar el juego cuando se haga clic en el botón "Restart"
  restartButton.addEventListener('click', () => {
    // Aquí puedes reiniciar las variables del juego y comenzar nuevamente
    hideGameOverScreen();
    gameOver = false;
  });

  joinButton.addEventListener('click',()=>{
    console.log("Join button clicked");
    const username = usernameInput.value; // Obtenemos el nombre del usuario del campo de entrada
    if (username.trim() !== '') {
      // Si el nombre no está vacío, enviamos la solicitud al servidor
      socket.emit('joinGame', { username });
      joinForm.style.display = 'none'; // Ocultamos el formulario después de unirse
      waitingSpan.classList.remove('hidden');
    }
  });

  // Manejamos el evento de envío del formulario
  joinForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Evitamos el comportamiento predeterminado del formulario (recargar la página)

    const username = usernameInput.value; // Obtenemos el nombre del usuario del campo de entrada
    if (username.trim() !== '') {
      // Si el nombre no está vacío, enviamos la solicitud al servidor
      socket.emit('joinGame', { username });
      joinForm.style.display = 'none'; // Ocultamos el formulario después de unirse
      waitingSpan.classList.remove('hidden');
    }
  });
});

/*startButton.addEventListener('click', () => {
  startTime = performance.now(); // Tiempo de inicio en milisegundos
  console.log('enviando testLatency. startTime: ', startTime);
  
  // Emitir el evento al servidor y esperar la respuesta
  try {
    socket.emit('testLatency', { startTime });
  } catch (error) {
    console.error(`Error emitiendo testLatency a través del socket`, error);
  }
});
*/
