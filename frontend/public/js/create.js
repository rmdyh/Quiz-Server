var socket = io();

socket.on('connect', function(){
    socket.emit('requestDbNames');//Get database names to display to user
});

socket.on('gameNamesData', function(data){
    var div = document.getElementById('game-list');
    // 将数据转换为数组并按照 id 从小到大排序
    var sortedData = Object.values(data).sort(function (a, b) {
        return a.id - b.id;
    });

    // 遍历排序后的数据
    for (var i = 0; i < sortedData.length; i++) {
        if (sortedData[i].id >= 0) {
            var button = document.createElement('button');
            button.innerHTML = sortedData[i].name;
            button.setAttribute('onClick', "startGame('" + sortedData[i].id + "')");
            div.appendChild(button);
        }
    }
});

function startGame(data){
    window.location.href="/host/" + "?id=" + data;
}
