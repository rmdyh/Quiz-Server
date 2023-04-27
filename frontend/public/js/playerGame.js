var socket = io();
var playerAnswered = false;
var answer = 0;
var playerName;

var params = jQuery.deparam(window.location.search); //Gets the id from url

socket.on('connect', function() {
    //Tell server that it is host connection from game view
    socket.emit('player-join-game', params);
    document.getElementsByClassName("buttons")[0].style.display="block"
});

socket.on('noGameFound', function(){
    window.location.href = '../../';//Redirect user to 'join game' page 
});

function answerSubmitted(num){
    if(playerAnswered == false){
        playerAnswered = true;
        socket.emit('playerAnswer', num);//Sends player answer to server
        //Hiding buttons from user
        document.getElementsByClassName("buttons")[0].style.display="none"
        document.getElementById('message').innerHTML = "Answer Submitted! Waiting on other players...";
        document.getElementById('message').style.display = "block";
        // Save the answer
        answer = num;
    }
}

socket.on('questionOver', function(playerData, correct){
    if(correct == answer){
        document.body.style.backgroundColor = "#4CAF50";
        document.getElementById('message').style.display = "block";
        document.getElementById('message').innerHTML = "Correct!";
    }else{
        document.body.style.backgroundColor = "#f94a1e";
        document.getElementById('message').style.display = "block";
        document.getElementById('message').innerHTML = "Incorrect!";
    }
    playerData.forEach(elem => {
        if(elem.name == playerName)
            document.getElementById('scoreText').innerHTML = "Score: " + elem.gameData.score;
    });
});

socket.on('nextQuestionPlayer', function(data){
    correct = false;
    playerAnswered = false;
    document.getElementsByClassName("buttons")[0].style.display="block"
    document.getElementById('message').style.display = "none";
    document.body.style.backgroundColor = "white";
    for(var i = 1; i <= 4; i++)
        document.getElementById('answer' + i).innerHTML = data.answers[i - 1];
});

socket.on('hostDisconnect', function(){
    window.location.href = "../../";
});

socket.on('playerGameData', function(data){
    playerName = data.name;
    document.getElementById('nameText').innerHTML = "Name: " + data.name;
    document.getElementById('scoreText').innerHTML = "Score: " + data.score;
});

socket.on('GameOver', function(_){
    document.body.style.backgroundColor = "#FFFFFF";
    document.getElementsByClassName("buttons")[0].style.display="none"
    document.getElementById('message').style.display = "block";
    document.getElementById('message').innerHTML = "GAME OVER";
});

