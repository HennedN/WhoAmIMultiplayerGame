// DOM Elements

const askQuestionForm = document.getElementById('ask-question-form');
const qst2 = document.getElementById('qst');
const askBtn = document.getElementById('ask-btn');
const gameLog = document.getElementById('gamelog');
const startGameBtn = document.getElementById('start-game-btn');
const yesBtn = document.getElementById('yes-btn');
const noBtn = document.getElementById('no-btn');
const solvedBtn = document.getElementById('solved-btn');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');


// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

// Join Game Lobby
socket.emit('joinRoom', { username, room });

socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

socket.on('gameMaster', gameMaster => {
  if (gameMaster.id === socket.id) {
    startGameBtn.hidden = false;
    yesBtn.hidden = false;
    noBtn.hidden = false;
    solvedBtn.hidden = false;
    yesBtn.disabled = true;
    noBtn.disabled = true;
    solvedBtn.disabled = true;
  }
});

socket.on('chooseWord', (gameMaster) => {
  if (gameMaster.id === socket.id) {
    socket.emit('wordChosen');
  }
});

socket.on('firstQuestion', (users) => {
  if (users[1].id === socket.id && users[1].turn === true) {
    qst2.readOnly = false;
    askBtn.disabled = false;
  }
});

socket.on('gameMasterTurn', (gameMaster) => {
  if (socket.id === gameMaster.id && gameMaster.turn === true) {
    yesBtn.disabled = false;
    noBtn.disabled = false;
    solvedBtn.disabled = false;
  }
})

socket.on('question', qst => {
  outputQuestion(qst);
  gameLog.scrollTop = gameLog.scrollHeight;
  socket.emit('gameMasterTurn');
});

socket.on('updateQuestionStatus', ({status, id})=> {
  updateQuestionStatus(status, id);

});

socket.on('samePlayerTurn', ({currentTurnPlayer, roomUsers}) => {
  if (currentTurnPlayer.id === socket.id && currentTurnPlayer.turn === true) {
    qst2.readOnly = false;
    askBtn.disabled = false;
    
  }
  outputUsers(roomUsers);
});

socket.on('nextPlayerTurn', (currentTurnPlayer) => {
  if (currentTurnPlayer.id === socket.id && currentTurnPlayer.turn === true) {
    qst2.readOnly = false;
    askBtn.disabled = false;
  }
});

socket.on('playerSolved', ({currentGameMaster, currentTurnPlayer, roomUsers}) => {
  alert(`${currentTurnPlayer.username} guessed who ${currentGameMaster.username} is!`);
  clearGameLog()
  outputUsers(roomUsers);
  socket.emit('setNextGameMaster', {currentGameMaster, currentTurnPlayer})
});

socket.on('resetGame', (gameMaster)=>{
  if (gameMaster.id === socket.id) {
    startGameBtn.hidden = false;
    yesBtn.hidden = false;
    noBtn.hidden = false;
    solvedBtn.hidden = false;
    yesBtn.disabled = true;
    noBtn.disabled = true;
    solvedBtn.disabled = true;
  }else{
    startGameBtn.hidden = true;
    yesBtn.hidden = true;
    noBtn.hidden = true;
    solvedBtn.hidden = true;
  }
  
});

// Event Listeners

// Submit Question
askQuestionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const qst = e.target.elements.qst.value;

    socket.emit('askedQuestion', qst);

    e.target.elements.qst.value = '';
    e.target.elements.qst.focus();
    qst2.readOnly = true;
    askBtn.disabled = true;
});

// Start Game
startGameBtn.addEventListener('click', () => {
    startGameBtn.hidden = true;
    socket.emit('gameStarted');
});

// Mark the Question as true
yesBtn.addEventListener('click', () => {
    const status = 'true';
    const id = socket.id;
    socket.emit('updateQuestionStatus', {status, id});
});

// Mark the Question as false
noBtn.addEventListener('click', () => {
    const status = 'false';
    const id = socket.id;
    socket.emit('updateQuestionStatus',  {status, id});
});

solvedBtn.addEventListener('click', () => {
  const status = 'solved';
  const id = socket.id;
  socket.emit('updateQuestionStatus',  {status, id});
});

// Functions

// Update Question

function updateQuestionStatus(status,id) {
  const result = gameLog.lastChild.innerHTML
  const qst = result.replace(/(<p[^>]+?>|<p>|<\/p>)/img, "");
  gameLog.removeChild(gameLog.lastChild);
  outputQuestion(qst, status);
}
// Output Question

function outputQuestion(qst, status) {
  const div = document.createElement('div');
  if (status === 'true'){
    div.classList.add('bg-success', 'border');
  }else if (status === 'false') {
    div.classList.add('bg-danger', 'border');
  }else if (status === 'solved') {
    div.classList.add('bg-alert', 'border');
  }else {
    div.classList.add('border');
  }

  div.innerHTML=`<p class='text-center text-light' style='min-height:40px;'> ${qst}</p>`;
  gameLog.appendChild(div);
};

function clearGameLog() {
  while (gameLog.childNodes.length > 3) {
    gameLog.removeChild(gameLog.lastChild);
  }
}

// add room name to DOM

function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM

function outputUsers(users) {

  userList.innerHTML = `
    ${users.map(user => {
      return (user.id === socket.id) ? 
          (`<li class="text-light list-group-item bg-dark"><i class="bi bi-person text-light"> ${user.username} Points: ${user.points}</i></li>`) :
          (`<li class="text-light list-group-item bg-dark">${user.username} Points: ${user.points}</li>`)
  }).join('')}
  `


}