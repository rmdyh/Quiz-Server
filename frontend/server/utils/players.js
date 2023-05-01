class Players {
    constructor () {
        this.players = [];
    }
    addPlayer(hostId, lobbyId, name, gameData){
        var player = {hostId, lobbyId, name, gameData};
        this.players.push(player);
        return player;
    }
    removePlayer(playerId){
        var player = this.getPlayer(playerId);
        
        if(player){
            this.players = this.players.filter((player) => player.playerId !== playerId);
        }
        return player;
    }
    getPlayer(playerId){
        return this.players.filter((player) => player.playerId === playerId)[0]
    }
    removePlayerByLobbyId(lobbyId){
        var player = this.getPlayerByLobbyId(lobbyId);
        
        if(player){
            this.players = this.players.filter((player) => player.lobbyId !== lobbyId);
        }
        return player;
    }
    getPlayerByLobbyId(lobbyId){
        return this.players.filter((player) => player.lobbyId === lobbyId)[0]
    }
    getPlayers(hostId){
        return this.players.filter((player) => player.hostId === hostId);
    }
}

module.exports = {Players};