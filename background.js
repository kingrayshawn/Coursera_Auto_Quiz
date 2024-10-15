var Statements = []
var Options = []
var Answers = []
var MultiChoice = []
var UserChoice = []
var useAIanswer = true

importScripts('API_KEY.js');

function getStorageData(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], function (result) {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(result[key]);
        });
    });
}

function setStorageData(key, data) {
    console.log(data)
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: data }, function () {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve();
        });
    });
}

function sameArray(arr1, arr2) {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
    if (arr1.length !== arr2.length) return false;

    for (let i = 0; i < arr1.length; i++) {
        const isArr1ElementArray = Array.isArray(arr1[i]);
        const isArr2ElementArray = Array.isArray(arr2[i]);

        if (isArr1ElementArray && isArr2ElementArray) {
            if (!sameArray(arr1[i], arr2[i])) {
                return false;
            }
        } else if (isArr1ElementArray !== isArr2ElementArray || arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
}

function emptyArray(arr) {
    if (!arr.length) return true;
    for (let item of arr) {
        if (typeof item == 'boolean') return false;
        if (item.length) return false;
    }
    return true;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (API_KEY == "Your_Gooele_Gemini_API_Key") useAIanswer = false;
    else useAIanswer = true;

    if (request.header == "sent questions") {
        processing_data(request.Statements, request.Options, request.MultiChoice, request.UserChoice, request.Answers)
        sendResponse({ status: "successfully get questions" });
    } else if (request.header == "get questions") {
        sendResponse({ Statements: Statements, Options: Options, MultiChoice: MultiChoice });
    } else {
        sendResponse({ status: "unknown header" });
    }
});

async function processing_data(statements, options, multiChoice, userChoice, answers) {
    let need_processing_questions = true;
    if (emptyArray(multiChoice)) need_processing_questions = false;
    if (sameArray(statements, Statements) && sameArray(options, Options)) need_processing_questions = false;

    if (sameArray(statements, Statements)) { // same question
        if (!emptyArray(options)) Options = JSON.parse(JSON.stringify(options));
        if (!emptyArray(multiChoice)) MultiChoice = JSON.parse(JSON.stringify(multiChoice));
        if (!emptyArray(userChoice)) UserChoice = JSON.parse(JSON.stringify(userChoice));

    } else { // different question
        Statements = JSON.parse(JSON.stringify(statements));
        Options = JSON.parse(JSON.stringify(options));
        MultiChoice = JSON.parse(JSON.stringify(multiChoice));
        UserChoice = JSON.parse(JSON.stringify(userChoice));
    }

    let need_processing_answers = true;
    if (emptyArray(answers) || emptyArray(UserChoice)) need_processing_answers = false;
    if (sameArray(answers, Answers)) need_processing_answers = false;

    Answers = JSON.parse(JSON.stringify(answers));

    if (need_processing_answers) await processing_answers();
    if (need_processing_questions) await processing_questions();
}


async function processing_questions() {
    console.log("--------------------processing_questions--------------------");
    for (let i = 0; i < Statements.length; i++) {
        console.log("Load Q" + (i + 1));

        let storageData = await getStorageData(Statements[i]);
        if (storageData) continue; // already stored

        if (useAIanswer && MultiChoice[i][0] != true) { // fill-in or singleChoice question
            console.log("Store Q" + (i + 1) + " by AI");
            await askAI(Statements[i], Options[i], MultiChoice[i][0]);
        } else { // multiChoice
            console.log("Store Q" + (i + 1));
            await setStorageData(Statements[i], Options[i]);
        }
    }
}

async function processing_answers() {
    console.log("--------------------processing_answers--------------------");

    for (let i = 0; i < Answers.length; i++) {
        // if (MultiChoice[i][0] == null) continue;

        let storageData = await getStorageData(Statements[i]);
        if (!storageData) storageData = Options[i];

        if (MultiChoice[i][0] == true) { // multiple Choice
            if (Answers[i].length == 1) { // no answer options
                if (Answers[i][0] == "Correct") {
                    let new_answer = UserChoice[i].map(str => "Correct:" + str);
                    console.log("Q" + (i + 1) + " Get correct answer");
                    await setStorageData(Statements[i], new_answer);
                } else {
                    new_answer = Options[i]; // not correct

                    if (new_answer.length > 1 && useAIanswer) {
                        console.log("Q" + (i + 1) + " Update answer by AI");
                        await askAI(Statements[i], new_answer, MultiChoice[i][0]);
                    } else {
                        console.log("Q" + (i + 1) + " Update answer");
                        await setStorageData(Statements[i], new_answer);
                    }
                }
            } else { // partical correct
                let new_answer = []
                for (let j = 0; j < Answers[i].length; j++) {
                    if (Answers[i][j] == "Correct") {
                        new_answer.push(UserChoice[i][j]);
                    }
                }
                new_answer = new_answer.map(str => "Correct:" + str);
                console.log("Q" + (i + 1) + " Get correct answer");
                await setStorageData(Statements[i], new_answer);
            }
        } else if (MultiChoice[i][0] == false) {
            if (Answers[i][0] == "Correct") {
                let new_answer = UserChoice[i].map(str => "Correct:" + str);
                console.log("Q" + (i + 1) + " Get correct answer");
                await setStorageData(Statements[i], new_answer);

            } else { // Incorrect
                let new_answer = storageData.filter(item => item !== UserChoice[i][0]);

                if (new_answer.length == 1) {
                    new_answer = new_answer.map(str => "Correct:" + str);
                    console.log("Q" + (i + 1) + " Get correct answer");
                    await setStorageData(Statements[i], new_answer);
                }else if (useAIanswer) {
                    console.log("Q" + (i + 1) + " Update answer by AI");
                    await askAI(Statements[i], new_answer, MultiChoice[i][0]);
                } else {
                    console.log("Q" + (i + 1) + " Update answer");
                    await setStorageData(Statements[i], new_answer);
                }
            }
        } else if (MultiChoice[i][0] == "fill-in") {
            if (Answers[i][0] == "Correct") {
                let new_answer = UserChoice[i].map(str => "Correct:" + str);
                console.log("Q" + (i + 1) + " Get correct answer");
                await setStorageData(Statements[i], new_answer);

            } else { // Incorrect
                if (useAIanswer) {
                    console.log("Q" + (i + 1) + " Update answer by AI");
                    await askAI(Statements[i], Options[i], MultiChoice[i][0]);
                } else {
                    console.log("Q" + (i + 1) + " Update answer");
                    await setStorageData(Statements[i], "unknown");
                }
            }
        }
    }

    setTimeout(() => {
        Answers = []
        console.log("reset answer")
    }, 3000);
}

async function askAI(statement, options, multichoice) {
    let message = statement + "\n"

    if(typeof multichoice == 'boolean'){
        for (let i = 0; i < options.length; i++) {
            message += "options" + i + " : " + options[i] + "\n";
        }
        if (multichoice) message += "This is a multiple-choice question; you can choose multiple answers.\n";
        message += "Only output the number of the correct options; do not explain.\n"
    }else{
        message += "This is a fill-in question. Just tell me the final answer. Don't output other symbols, and don't explain.\n";
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    const body = {
        contents: [
            {
                parts: [
                    { text: message }
                ]
            }
        ],
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (response.ok) {
        const data = await response.json();
        const AIrespone = data.candidates[0].content.parts[0].text

        console.log(message)
        console.log(AIrespone)

        let new_options = []
        if (multichoice == 'fill-in') {
            new_options.push(AIrespone);

        } else if (multichoice) {
            let index = AIrespone.split(',').map(item => parseInt(item.trim(), 10));
            for (let idx of index) {
                if (!isNaN(idx) && 0 <= idx && idx < options.length) {
                    new_options.push(options[idx]);
                }
            }
        } else {
            let idx = parseInt(AIrespone, 10)

            new_options = options.slice();
            if (!isNaN(idx) && 0 <= idx && idx < options.length) {
                let AIanswer = new_options.splice(idx, 1)[0];
                new_options.unshift(AIanswer);
            }
        }
        await setStorageData(statement, new_options);
    } else {
        console.error(`Gemini api request fail! status: ${response.status}`);

        if (multichoice == 'fill-in') options = ["unknown"]
        await setStorageData(statement, options);

    }
}