var socket = io();

var params = jQuery.deparam(window.location.search); //Gets the id from url

var timer;

var time = 20;

//When host connects to server
socket.on('connect', function() {
    
    //Tell server that it is host connection from game view
    socket.emit('host-join-game', params);
});

socket.on('noGameFound', function(){
   window.location.href = '../../';//Redirect user to 'join game' page
});

socket.on('gameQuestions', function(data){
    console.log(data)
    document.getElementById('question').innerHTML = data.question;
    for(var i = 1; i <= 4; i++)
        document.getElementById('answer' + i).innerHTML = data.answers[i - 1];
    document.getElementById('questionNum').innerHTML = "Question " + data.qcount;
    document.getElementById('playersAnswered').innerHTML = "Players Answered 0 / " + data.playersInGame;
    updateTimer();
});

function updateTimer(){
    time = 20;
    timer = setInterval(function(){
        time -= 1;
        document.getElementById('num').textContent = " " + time;
        if(time == 0){
            socket.emit('timeUp');
        }
    }, 1000);
}

socket.on('updatePlayersAnswered', function(data){
    // Update answered
    var text = "Players Answered " + data.playersAnswered + " / " + data.playersInGame;
    document.getElementById('playersAnswered').innerHTML = text; 
    // Return the time
    socket.emit('questionTime', {
        player: data.playerId,
        time: data.correct ? time : 0
    });
});

socket.on('questionOver', function(playerData, correct){
    clearInterval(timer);
    var player_answers = [0, 0, 0, 0];
    var total = 0;
    //Hide elements on page
    document.getElementById('playersAnswered').style.display = "none";
    document.getElementById('timerText').style.display = "none";
    
    // Calc the total and the number of ans for each choice
    for(var i = 0; i < playerData.length; i++){
        ans = playerData[i].gameData.answer
        player_answers[ans - 1] += 1;
        total += 1;
    }
    
    // For each answer
    for(var i = 1; i < 4; i++){
        // Shows user correct answer with effects on elements
        var elem = document.getElementById('answer' + i);
        if(i == correct)
            elem.innerHTML = "&#10004" + " " + elem.innerHTML;
        else{
            elem.style.filter = "grayscale(50%)";
        }
        // Gets values for graph
        ans_percent = player_answers[i - 1] / total * 100;
        // Draw the graph
        var square = document.getElementById('square' + i)
        square.style.height = ans_percent + "px";
        square.nextElementSibling.innerHTML = ans_percent + "%";
    }
    // Show the graph and button
    document.getElementsByClassName('question-results')[0].style.display = "block";
    document.getElementById('nextQButton').style.display = "block";
});

function nextQuestion(){
    // Hide the graph and button
    document.getElementsByClassName('question-results')[0].style.display = "none";
    document.getElementById('nextQButton').style.display = "none";
    // Show the time and so on
    document.getElementById('playersAnswered').style.display = "block";
    document.getElementById('timerText').style.display = "block";
    document.getElementById('num').innerHTML = " 20";
    // Clean the question and answer
    document.getElementById('question').innerHTML = "  ";
    for(var i = 1; i <= 4; i++){
        var ans = document.getElementById('answer' + i);
        ans.innerHTML = "  ";
        ans.style.filter = "none";
    }
    socket.emit('nextQuestion'); //Tell server to start new question
}

socket.on('GameOver', function(data){
    // Display the winner
    data = data.ret;
    for(var i = 1; i <= 5; i++){
        var text = i + '. ' + data[i-1].name + ' (' + data[i-1].score + ')';
        document.getElementById('winner' + i).innerHTML = text;
    }
    // Hide everything and show the results
    document.getElementsByClassName('question-results')[0].style.display = "none";
    document.getElementsByClassName('question')[0].style.display = "none";
    document.getElementById('nextQButton').style.display = "none";
    document.getElementsByClassName('stats')[0].style.display = "none";
    document.getElementsByClassName('game-results')[0].style.display = "block";
});





















