class Players {
    constructor () {
        this.players = [];
    }
    addPlayer(hostId, playerLobbyId, name, gameData){
        var player = {hostId, playerLobbyId, name, gameData};
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
    removePlayerByLobbyId(playerLobbyId){
        var player = this.getPlayerByLobbyId(playerLobbyId);
        
        if(player){
            this.players = this.players.filter((player) => player.playerLobbyId !== playerLobbyId);
        }
        return player;
    }
    getPlayerByLobbyId(playerLobbyId){
        return this.players.filter((player) => player.playerLobbyId === playerLobbyId)[0]
    }
    getPlayers(hostId){
        return this.players.filter((player) => player.hostId === hostId);
    }
}

module.exports = {Players};