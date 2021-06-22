const users = [];

function userJoin(index, id, username, room, role, turn, points) {
    const user = {index, id, username, room, role, turn, points};
    
    users.push(user);
    return user;
}

function getCurrentUser(id) {
    return users.find(user => user.id === id);
}

function setCurrentGameMaster(users) {
    return users[0].role = 'Game Master';
}

function getCurrentGameMaster(users) {
    return users.find(user => user.role === "Game Master");
}

function getCurrentTurnPlayer(users) {
    return users.find(user => user.turn === true);
}

function setNextTurnPlayer(room) {
    var nextTurnPlayer = getRoomUsers(room);
    for (let index = 0; index < nextTurnPlayer.length; index++) {

        if (index === nextTurnPlayer.length){
            index = 0;
        }
        const player = nextTurnPlayer[index];
 
        if ((player.turn === false) && (player.role != 'Game Master')) {
            player.turn = true;
            index = player.index;
            return player
        }
        
    }
}

function userLeave(id) {
    const index = users.findIndex(user => user.id === id);

    if (index !== -1){
        return users.splice(index, 1)[0];
    }
}

function getRoomUsers(room) {
    return users.filter(user => user.room === room);
}

module.exports = {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
    getCurrentGameMaster,
    setCurrentGameMaster,
    getCurrentTurnPlayer,
    setNextTurnPlayer
}