var socket = io();
var questionNum = 1; //Starts at two because question 1 is already present

function updateDatabase(){
    var questions = [];
    var name = document.getElementById('name').value;
    for(var i = 1; i <= questionNum; i++){
        var question = document.getElementById('q' + i).value;
        var answer1 = document.getElementById(i + 'a1').value;
        var answer2 = document.getElementById(i + 'a2').value;
        var answer3 = document.getElementById(i + 'a3').value;
        var answer4 = document.getElementById(i + 'a4').value;
        var correct = document.getElementById('correct' + i).value;
        var qtime = document.getElementById('time' + i).value;
        var answers = [answer1, answer2, answer3, answer4];
        questions.push({"question": question, "answers": answers, "correct": correct, "time": qtime})
    }
    
    var quiz = {id: 0, "name": name, "questions": questions};
    socket.emit('newQuiz', quiz);
}

function addQuestion(){
    questionNum += 1;
    
    var newQuestionDiv = document.createElement("div");
    newQuestionDiv.setAttribute('class', 'question-field');//Sets class of div
    newQuestionDiv.innerHTML = `<div><label>Question ${questionNum}: </label> \
                                <input class="question" id="q${questionNum}" type="text" /></div> \
                                <div><label>Answer 1: </label> \
                                <input id="${questionNum}a1" type="text" /> \
                                <label>Answer 2: </label> \
                                <input id="${questionNum}a2" type="text" /></div> \
                                <div><label>Answer 3: </label> \
                                <input id="${questionNum}a3" type="text" /> \
                                <label>Answer 4: </label> \
                                <input id="${questionNum}a4" type="text" /> </div> \
                                <div><label>Correct Answer (1-4) :</label> \
                                <input class="correct" id="correct${questionNum}" type="number" /> \
                                <label>Time :</label> \
                                <input class="time" id="time${questionNum}" type="number" value="20" /></div>`
    newQuestionDiv.style.backgroundColor = randomColor();
    
    var questionsDiv = document.getElementById('all-questions');
    questionsDiv.appendChild(newQuestionDiv);//Adds the question div to the screen
}

//Called when user wants to exit quiz creator
function cancelQuiz(){
    if (confirm("Are you sure you want to exit? All work will be DELETED!")) {
        window.location.href = "../";
    }
}

socket.on('startGameFromCreator', function(data){
    window.location.href = "../../host/?id=" + data;
});

function randomColor(){
    
    var colors = ['#4CAF50', '#f94a1e', '#3399ff', '#ff9933'];
    var randomNum = Math.floor(Math.random() * 4);
    return colors[randomNum];
}

function setBGColor(){
    var randColor = randomColor();
    document.getElementsByClassName('question-field')[0].style.backgroundColor = randColor;
}









