var Statements = []
var Options = []
var MultiChoice = []

function emptyArray(arr) {
    if (!arr.length) return true;
    for (let item of arr) {
        if (item.length) return false;
    }
    return true;
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

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('fill').addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: autofill,
                args: [Statements, false]
            });
        });
    });
    document.getElementById('fillandsubmit').addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: autofill,
                args: [Statements, true]
            });
        });
    });

    chrome.runtime.sendMessage({ header: "get questions" }, function (response) {
        update(response);
        show_on_popup();
    });

    setInterval(() => {
        chrome.runtime.sendMessage({ header: "get questions" }, function (response) {
            let change = update(response);
            if (change) document.getElementById('questionList').innerHTML = '';
            show_on_popup();
        });
    }, 500);
});

function update(response) {
    let change = false;
    if (!sameArray(response.Statements, Statements)) {
        Statements = JSON.parse(JSON.stringify(response.Statements));
        change = true;
    }
    if (!sameArray(response.Options, Options)) {
        Options = JSON.parse(JSON.stringify(response.Options));
        change = true;
    }
    if (!sameArray(response.MultiChoice, MultiChoice)) {
        MultiChoice = JSON.parse(JSON.stringify(response.MultiChoice));
        change = true;
    }
    return change;
}

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


async function show_on_popup() {
    for (let i = 0; i < Statements.length; i++) {
        let ansIndex = "";

        let storageData = await getStorageData(Statements[i]);
        if (storageData) {
            let answers = []
            if (MultiChoice[i][0] == true) answers = storageData
            else answers = [storageData[0]]

            if (MultiChoice[i][0] == 'fill-in') {
                ansIndex = answers
            } else {
                for (let answer of answers) {
                    if (ansIndex != "") ansIndex += ", ";
                    ansIndex += Options[i].indexOf(answer) + 1;

                    // suggest answer appears 0
                    if (Options[i].indexOf(answer) == -1) alert("Error on Question " + (i + 1) + " : Unable to find the answer in database.");
                }
            }
        } else {
            ansIndex = "asking";
        }
        let questionItem = document.querySelector(`div#questionList div#q${i + 1}`);
        let answerText = `${i + 1} : ${ansIndex}`

        if (questionItem) {
            if (answerText == questionItem.innerText) continue;
            questionItem.innerText = answerText;
        } else {
            questionItem = document.createElement('div');
            questionItem.innerText = answerText;
            questionItem.id = "q" + (i + 1);

            const questionList = document.getElementById('questionList');
            questionList.appendChild(questionItem);
        }
    }
}


function autofill(Statements, submit) {
    const QBlock = document.querySelectorAll('div.rc-FormPartsQuestion.css-kntsav');

    for (let i = 0; i < QBlock.length; i++) {
        chrome.storage.local.get([Statements[i]], function (result) {
            const radios = QBlock[i].querySelectorAll('input[type="radio"]');
            const checkboxes = QBlock[i].querySelectorAll('input[type="checkbox"]');
            const fillinbox = QBlock[i].querySelector('input[type="text"][placeholder="Enter answer here"]');

            if (radios.length) {
                let answer = [result[Statements[i]][0]]
                radios.forEach(radio => {
                    const optionStatement = radio.nextElementSibling.innerText;
                    if (answer.includes(optionStatement) && !radio.checked) radio.click()
                });
            } else if (checkboxes.length) {
                let answer = result[Statements[i]]
                checkboxes.forEach(checkbox => {
                    const optionStatement = checkbox.nextElementSibling.innerText;

                    if (answer.includes(optionStatement) && !checkbox.checked) checkbox.click()
                    if (!answer.includes(optionStatement) && checkbox.checked) checkbox.click()
                });
            } else if (fillinbox) {
                let answer = [result[Statements[i]][0]]

                fillinbox.value = answer;
                fillinbox.dispatchEvent(new Event('input', { bubbles: true }));
                fillinbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }

    let signed = document.getElementById('agreement-checkbox-base')
    if (!signed.checked) signed.click();

    if (submit) {
        setTimeout(() => {
            document.querySelector('button[data-test="submit-button"]').click();
        }, 1000);
    }
}
