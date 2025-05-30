class LiveGames {
    constructor () {
        this.games = [];
    }
    addGame(pin, hostId, gameLive, gameData){
        var game = {pin, hostId, gameLive, gameData};
        this.games.push(game);
        game.gameData.playerNum = 0;
        return game;
    }
    removeGame(hostId){
        var game = this.getGame(hostId);
        
        if(game){
            this.games = this.games.filter((game) => game.hostId !== hostId);
        }
        return game;
    }
    isGameExist(hostId){
        return this.getGame(hostId) != undefined;
    }
    getGame(hostId){
        return this.games.filter((game) => game.hostId === hostId)[0];
    }
    isGameExistbyPin(pin){
        return this.getGamebyPin(pin) != undefined;
    }
    getGamebyPin(pin){
        return this.games.filter((game) => game.pin == pin)[0];
    }
}

module.exports = {LiveGames};