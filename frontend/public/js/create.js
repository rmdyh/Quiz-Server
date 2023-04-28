var socket = io();

socket.on('connect', function(){
    socket.emit('requestDbNames');//Get database names to display to user
});

socket.on('gameNamesData', function(data){
    for(var i = 0; i < Object.keys(data).length; i++){
        var div = document.getElementById('game-list');
        var button = document.createElement('button');
        
        button.innerHTML = data[i].name;
        button.setAttribute('onClick', "startGame('" + data[i].id + "')");
        div.appendChild(button);
    }
});

function startGame(data){
    window.location.href="/host/" + "?id=" + data;
}
