const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { userJoin, getCurrentUser, userLeave, getRoomUsers, getCurrentGameMaster, setCurrentGameMaster, getCurrentTurnPlayer, setNextTurnPlayer } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);



// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) =>{
    index = getRoomUsers(room).length;
    var user = userJoin(index, socket.id ,username, room, 'player', false, 0);
    socket.join(user.room);
    getRoomUsers(room)[0].points = 1;
    var newGameMaster = null;
    var gameMaster = setCurrentGameMaster( getRoomUsers(user.room), newGameMaster)
    io.to(user.room).emit('gameMaster', gameMaster)

    socket.on('askedQuestion', (qst) => {
      io.to(user.room).emit('question', qst);
    });

    socket.on('gameStarted', () => {
      var users = getRoomUsers(gameMaster.room)
      newGameMaster = setCurrentGameMaster(users, newGameMaster);
      io.to(user.room).emit('chooseWord', newGameMaster);
    });

    socket.on('wordChosen', () => {
      gameMaster.turn = false;
      var nextTurnPlayer = setNextTurnPlayer(user.room);
      io.to(user.room).emit('nextPlayerTurn', nextTurnPlayer);
      io.to(user.room).emit('firstQuestion',nextTurnPlayer);
    });

    socket.on('gameMasterTurn', () => {
      getCurrentGameMaster(getRoomUsers(user.room)).turn = true;
      io.to(user.room).emit('gameMasterTurn', gameMaster);
    });
  
    socket.on('updateQuestionStatus', ({status, id}) => {
      const currentUser = getCurrentUser(id);
      if (currentUser.role === 'Game Master' && currentUser.turn === true) {
        io.to(user.room).emit('updateQuestionStatus', {status, id});
        if (status === 'true') {
          var roomUsers = getRoomUsers(user.room);
          getCurrentGameMaster(getRoomUsers(user.room)).turn = false;
          var currentTurnPlayer = (getCurrentTurnPlayer(getRoomUsers(user.room)));
          io.to(user.room).emit('samePlayerTurn', {currentTurnPlayer, roomUsers});
        }else if (status === 'false') {
          getCurrentGameMaster(getRoomUsers(user.room)).turn = false;
          var currentTurnPlayer = (getCurrentTurnPlayer(getRoomUsers(user.room)));
          var nextTurnPlayer = setNextTurnPlayer(user.room);
          io.to(user.room).emit('nextPlayerTurn', nextTurnPlayer);
          currentTurnPlayer.turn = false;
        }else if (status === 'solved') {
          var roomUsers = getRoomUsers(user.room);
          var currentGameMaster = getCurrentGameMaster(getRoomUsers(user.room));
          currentGameMaster.turn = false;
          var currentTurnPlayer = (getCurrentTurnPlayer(getRoomUsers(user.room)));
          currentTurnPlayer.points = currentTurnPlayer.points + 2;
          io.to(user.room).emit('playerSolved', {currentGameMaster, currentTurnPlayer, roomUsers});
        }
      }      
    });

    socket.on('setNextGameMaster', ({currentGameMaster, currentTurnPlayer, roomUsers}) => {
      currentGameMaster.role = 'player';
      newGameMaster = currentTurnPlayer;
      gameMaster = setCurrentGameMaster(roomUsers, newGameMaster);

      io.to(user.room).emit('resetGame', gameMaster);
    });

    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    })

    socket.on('disconnect', () => {
      const user = userLeave(socket.id);

      if (user) {
        io.to(user.room).emit('roomUsers', {
          room: user.room,
          users: getRoomUsers(user.room)
        })
      }
    })
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));