var Statements = []
var Options = []
var Answers = []
var AnsOptions = []
var MultiChoice = []
var UserChoice = []
var CurrentUserChoice = []

function sameArray(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((value, index) => value == arr2[index]);
}

function same2DArray(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i].length !== arr2[i].length) return false;

        for (let j = 0; j < arr1[i].length; j++) {
            if (arr1[i][j] !== arr2[i][j]) {
                return false;
            }
        }
    }

    return true;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.header == "sent questions") {
        processing_questions(request.Statements, request.Options, request.MultiChoice);

    } else if (request.header == "sent answers") {
        processing_answers(request.Answers);

    } else if (request.header == "sent user choice") {
        processing_userchoice(request.Options);

    } else if (request.header == "get questions") {
        sendResponse({ Statements: Statements, Options: Options, MultiChoice: MultiChoice });

    }
});


function processing_questions(statements, options, multiChoice) {
    if(sameArray(statements, Statements) && same2DArray(options, Options)) return;

    if(sameArray(statements, Statements)){ // same question
        if(options.length) Options = options.slice();
        if(multiChoice.length) MultiChoice = multiChoice.slice();
    }else{ // different question
        Statements = statements.slice();
        Options = options.slice();
        MultiChoice = multiChoice.slice();
    }

    console.log("Get Questions");
    console.log(statements)
    console.log(options)
    console.log(multiChoice)

    for (let i = 0; i < statements.length; i++) {
        chrome.storage.local.get([statements[i]], function (result) {
            if (!result[statements[i]] && options.length) {
                chrome.storage.local.set({ [statements[i]]: options[i] });
            }
        });
    }
}

function processing_userchoice(userChoice) {
    if(same2DArray(userChoice, UserChoice)) return;
    UserChoice = userChoice.slice()

    console.log("Get User Choice");
    console.log(userChoice)
}

function processing_answers(answers) {
    if (!answers.length || !Statements.length || !UserChoice.length || !MultiChoice.length) return;
    
    Answers = answers.slice();

    console.log("Get Answers");
    console.log(answers)
    console.log(UserChoice)
    console.log(Statements)
    console.log(Options)
    console.log(MultiChoice)

    
    // determind userchoise is in Option or not?
    for (let i = 0; i < answers.length; i++) {
        chrome.storage.local.get([Statements[i]], function (result) {
            let new_answer = []
            
            if (MultiChoice[i][0]) { // multiple Choice
                if (answers[i].length == 1) { // all correct
                    if(answers[i][0] == "Correct")  new_answer = [UserChoice[i]]
                    else new_answer = [Options[i]]
                }else{ // partical correct
                    for (let j = 0; j < answers[i].length; j++) {
                        if (answers[i][j] == "Correct") {
                            new_answer.push(UserChoice[i][j]);
                        }
                    }
                }

            } else if (answers[i][0] == "Correct") {
                new_answer = [UserChoice[i][0]]

            } else if (answers[i][0] == "Incorrect") {
                new_answer = result[Statements[i]].slice();
                new_answer = new_answer.filter(item => item !== UserChoice[i][0]);
            }

            console.log(new_answer)
            console.log(result[Statements[i]])
            if(!sameArray(new_answer, result[Statements[i]])) {
                console.log("update")
                console.log(new_answer)
                chrome.storage.local.set({ [Statements[i]]: new_answer });
            }
        });
    }
}