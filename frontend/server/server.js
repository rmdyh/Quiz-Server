//Import dependencies
const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

//Import classes
const { LiveGames } = require('./utils/liveGames');
const { Players } = require('./utils/players');

const publicPath = path.join(__dirname, '../public');
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var games = new LiveGames();
var players = new Players();

// Mongodb setup
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

// getGameByid returns a promise with a raw result of query gameid.
async function getGameById(gameid) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db('kahootDB');
            var query = { id: parseInt(gameid) };

            dbo.collection("kahootGames").find(query).toArray((err, res) => {
                if (err) throw err;
                resolve(res[0]);
            });

            db.close()
        });
    })
}

app.use(express.static(publicPath));

//Starting server on port 3000
server.listen(3000, () => {
    console.log("Server started on port 3000");
});

//When a connection to server is made from client
io.on('connection', (socket) => {

    //When host connects for the first time
    socket.on('host-join', (data) => {
        //Check to see if id passed in url corresponds to id of kahoot game in database
        getGameById(data.id).then((res) => {
            //A kahoot was found with the id passed in url
            if (res !== undefined) {
                var gamePin = Math.floor(Math.random() * 90000) + 10000; //new pin for game
                //Creates a game with pin and host id
                games.addGame(gamePin, socket.id, false, { playersAnswered: 0, questionLive: false, gameid: data.id, question: 1 });
                var game = games.getGame(socket.id); //Gets the game data
                socket.join(game.pin);//The host is joining a room based on the pin
                console.log('Game Created with pin:', game.pin);
                //Sending game pin to host so they can display it for players to join
                socket.emit('showGamePin', { pin: game.pin });
            } else {
                socket.emit('noGameFound');
            }
        })
    });

    //When the host connects from the game view
    socket.on('host-join-game', (data) => {
        var oldHostId = data.id;
        var game = games.getGame(oldHostId);//Gets game with old host id
        if (game) {
            game.hostId = socket.id;//Changes the game host id to new host id
            socket.join(game.pin);
            var playerData = players.getPlayers(oldHostId);//Gets player in game
            for (var i = 0; i < Object.keys(players.players).length; i++) {
                if (players.players[i].hostId == oldHostId) {
                    players.players[i].hostId = socket.id;
                }
            }
            var gameid = game.gameData.gameid;
            getGameById(gameid).then((res) => {
                var question = res.questions[0];
                // send the question to host
                socket.emit('gameQuestions', {
                    question: question.question,
                    answers: question.answers,
                    qcount: game.gameData.question + " / " + res.questions.length,
                    playersInGame: playerData.length
                });
                game.gameData.questionNow = question.answers;
                game.gameData.correct = question.correct;
                // tell the players that the game is start
                io.to(game.pin).emit('gameStartedPlayer');
            }).catch((err) => {
                throw err;
            })
            // Set the game state to alive
            game.gameData.questionLive = true;
        } else {
            socket.emit('noGameFound');//No game was found, redirect user
        }
    });

    //When player connects for the first time
    socket.on('player-join', (params) => {
        // game by pin
        var game = games.getGamebyPin(params.pin);
        if (game) {
            var hostId = game.hostId; //Get the id of host of game
            var player = players.getPlayers(hostId).filter((player) => player.name === params.name)[0];
            if (player) {
                // Tell the player that player exist
                // Player is sent back to 'join' page
                socket.emit('playerExist');
                console.log('Player ' + params.name + ' is rejected because the player exists.');
            }
            else {
                players.addPlayer(hostId, socket.id, params.name, { score: 0, answer: 0, appendScore: 0 }); //add player to game
                socket.join(params.pin); //Player is joining room based on pin
                var playersInGame = players.getPlayers(hostId); //Getting all players in game
                io.to(params.pin).emit('updatePlayerLobby', playersInGame);//Sending host player data to display
                console.log('Player ' + params.name + ' connected to game ' + params.pin);
            }
        }
        else {
            // Tell the player that game is not fount
            // Player is sent back to 'join' page
            socket.emit('noGameFound');
            console.log('Player ' + params.name + ' is rejected because the lobby not exists.');
        }
    });

    //When the player connects from game view
    socket.on('player-join-game', (data) => {
        var player = players.getPlayerByLobbyId(data.id);
        if (player) {
            var game = games.getGame(player.hostId);
            // only when game is alive and
            // there is no other player with the same lobby id
            // can this socket join the game
            if (game.gameLive && player.playerId == undefined) {
                socket.join(game.pin);
                player.playerId = socket.id; // Update player id with socket id
                socket.emit('playerGameData', { name: player.name, score: player.gameData.score });
                if (player.gameData.answer == 0) {
                    // tell the player the going on question
                    // bc the player haven't submitted its answer
                    socket.emit('nextQuestionPlayer', { answers: game.gameData.questionNow });
                }
                else {
                    // tell the player its submitted answer
                    socket.emit('haveSubmitted', player.gameData.answer)
                }
                return;
            }
        }
        socket.emit('noGameFound');//No player found
    });

    //When a host or player leaves the site
    socket.on('disconnect', () => {
        var game = games.getGame(socket.id); //Finding game with socket.id
        //If a game hosted by that id is found, the socket disconnected is a host
        if (game) {
            //Checking to see if host was disconnected or was sent to game view
            if (game.gameLive == false) {
                games.removeGame(socket.id);//Remove the game from games class
                console.log('Game ended with pin:', game.pin);

                var playersToRemove = players.getPlayers(game.hostId); //Getting all players in the game
                //For each player in the game
                for (var i = 0; i < playersToRemove.length; i++) {
                    players.removePlayer(playersToRemove[i].playerId); //Removing each player from player class
                }
                io.to(game.pin).emit('hostDisconnect'); //Send player back to 'join' screen
            }
            socket.leave(game.pin); //Socket is leaving room
        } else {
            //No game has been found, so it is a player socket that has disconnected
            var player = players.getPlayer(socket.id); //Getting player with socket.id
            //If a player has been found with that id
            if (player) {
                var hostId = player.hostId;//Gets id of host of the game
                var game = games.getGame(hostId);//Gets game data with hostId
                if (game) {
                    if (game.gameLive) {
                        player.playerId = undefined;
                    } else {
                        players.removePlayer(socket.id);//Removes player from players class
                        socket.leave(game.pin); //Player is leaving the room
                    }
                }
            }
            var player = players.getPlayerByLobbyId(socket.id)
            // If the player is in the lobby
            if (player) {
                var hostId = player.hostId;//Gets id of host of the game
                var game = games.getGame(hostId);//Gets game data with hostId
                if (game.gameLive == false) {
                    players.removePlayerByLobbyId(socket.id);//Removes player from players class
                    var playersInGame = players.getPlayers(hostId);//Gets remaining players in game
                    io.to(game.pin).emit('updatePlayerLobby', playersInGame);//Sends data to host to update screen
                }
                socket.leave(game.pin); //Player is leaving the room
            }
        }

    });

    //Sets data in player class to answer from player
    socket.on('playerAnswer', function (num) {
        var player = players.getPlayer(socket.id);
        var hostId = player.hostId;
        var playerNum = players.getPlayers(hostId).length;
        var game = games.getGame(hostId);
        if (game.gameData.questionLive == true) {//if the question is still live
            player.gameData.answer = num;
            game.gameData.playersAnswered += 1;

            var correctAnswer = game.gameData.correct;
            //Checks player answer with correct answer
            if (num == correctAnswer) {
                player.gameData.appendScore += 100;
            }
            //update host screen of num players answered
            io.to(game.pin).emit('updatePlayersAnswered', {
                playersInGame: playerNum,
                playersAnswered: game.gameData.playersAnswered,
                playerId: socket.id,
                correct: num == correctAnswer
            });
        }
    });

    socket.on('questionTime', function (data) {
        var time = data.time / 20;
        time = time * 100;
        var playerid = data.player;
        var player = players.getPlayer(playerid);
        player.gameData.appendScore += time;

        // Get the game
        var hostId = player.hostId;
        var game = games.getGame(hostId);
        var playerNum = players.getPlayers(hostId).length;
        // Checks if all players answered
        if (game.gameData.playersAnswered == playerNum && game.gameData.questionLive) {
            game.gameData.questionLive = false; //Question has been ended bc players all answered under time
            var playerData = players.getPlayers(game.hostId);
            // Update the score for every player
            playerData.forEach(player => {
                player.gameData.score = player.gameData.appendScore;
            })
            //Tell everyone that question is over
            io.to(game.pin).emit('questionOver', playerData, game.gameData.correct);
        }
    });

    socket.on('timeUp', function () {
        var game = games.getGame(socket.id);
        game.gameData.questionLive = false;
        var playerData = players.getPlayers(game.hostId);
        // Update the score for every player
        playerData.forEach(player => {
            player.gameData.score = player.gameData.appendScore;
        })

        var correctAnswer = game.gameData.correct;
        //Tell everyone that question is over
        io.to(game.pin).emit('questionOver', playerData, correctAnswer);
    });

    socket.on('nextQuestion', function () {
        var playerData = players.getPlayers(socket.id);
        //Reset players current answer to 0
        for (var i = 0; i < Object.keys(players.players).length; i++) {
            if (players.players[i].hostId == socket.id) {
                players.players[i].gameData.answer = 0;
            }
        }

        var game = games.getGame(socket.id);
        game.gameData.playersAnswered = 0;
        game.gameData.question += 1;
        var gameid = game.gameData.gameid;

        getGameById(gameid).then((res) => {
            var question = null;

            if (res.questions.length >= game.gameData.question) {
                question = res.questions[game.gameData.question - 1];
            }

            if (question != null) {
                game.gameData.questionLive = true;
                socket.emit('gameQuestions', {
                    question: question.question,
                    answers: question.answers,
                    qcount: game.gameData.question + " / " + res.questions.length,
                    playersInGame: playerData.length
                });
                game.gameData.questionNow = question.answers;
                game.gameData.correct = question.correct;
                // tell players the next question
                io.to(game.pin).emit('nextQuestionPlayer', { answers: question.answers });
            }
            else {
                var playersInGame = players.getPlayers(game.hostId);
                playersInGame.sort((a, b) => {
                    return b.gameData.score - a.gameData.score;
                })
                var ret = [];
                var resultStr = "Quiz " + game.pin + " end! Results: ";
                for (var i = 0; i < 5; i++) {
                    if (i < playersInGame.length) {
                        ret.push({
                            name: playersInGame[i].name,
                            score: playersInGame[i].gameData.score
                        });
                        resultStr += playersInGame[i].name + '(' + playersInGame[i].playerLobbyId + ');';
                    } else {
                        ret.push({
                            name: '古明地こいし',
                            score: 0
                        });
                    }
                }
                game.gameLive = false;
                console.log(resultStr);
                io.to(game.pin).emit('GameOver', { ret: ret });
            }
        }).catch((err) => {
            throw err;
        })
    });

    //When the host starts the game
    socket.on('startGame', () => {
        var game = games.getGame(socket.id);//Get the game based on socket.id
        game.gameLive = true;
        socket.emit('gameStarted', game.hostId);//Tell player and host that game has started
    });

    //Give user game names data
    socket.on('requestDbNames', function () {

        MongoClient.connect(url, function (err, db) {
            if (err) throw err;

            var dbo = db.db('kahootDB');
            dbo.collection("kahootGames").find().toArray(function (err, res) {
                if (err) throw err;
                socket.emit('gameNamesData', res);
                db.close();
            });
        });


    });


    socket.on('newQuiz', function (data) {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db('kahootDB');
            dbo.collection('kahootGames').find({}).toArray(function (err, result) {
                if (err) throw err;
                var num = Object.keys(result).length;
                if (num == 0) {
                    data.id = 1
                    num = 1
                } else {
                    data.id = result[num - 1].id + 1;
                }
                var game = data;
                dbo.collection("kahootGames").insertOne(game, function (err, res) {
                    if (err) throw err;
                    db.close();
                });
                db.close();
                socket.emit('startGameFromCreator', num);
            });

        });


    });

});

