var Statements = []
var Options = []
var MultiChoice = []

document.addEventListener('DOMContentLoaded', () => {
    chrome.runtime.sendMessage({ header: "get questions" }, function (response) {
        show_on_popup(response.Statements, response.Options, response.MultiChoice);
    });
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
});

function emptyArray(arr) {
    if (!arr.length) return true;
    for (let item of arr) {
        if (item.length) return false;
    }
    return true;
}

function show_on_popup(statements, options, multiChoice) {
    if (emptyArray(options)) {
        const questionList = document.getElementById('questionList');
        questionList.innerText = "Refresh"
        return;
    }

    Statements = JSON.parse(JSON.stringify(statements));
    Options = JSON.parse(JSON.stringify(options));
    MultiChoice = JSON.parse(JSON.stringify(multiChoice));

    for (let i = 0; i < Statements.length; i++) {
        chrome.storage.local.get([Statements[i]], function (result) {
            let ansIndex = "";

            if (result[Statements[i]]) {
                let answers = []
                if (MultiChoice[i][0]) answers = result[Statements[i]]
                else answers = [result[Statements[i]][0]]

                for (let answer of answers) { 
                    if(ansIndex != "") ansIndex += ", ";
                    ansIndex += Options[i].indexOf(answer) + 1;

                    // suggest answer appears 0
                    if(Options[i].indexOf(answer) == -1) alert(Statements[i] + " : " + answers)
                }
            } else {
                ansIndex = "asking";
            }

            const questionItem = document.createElement('div');
            questionItem.innerText = `${i + 1} : ${ansIndex}`;

            const questionList = document.getElementById('questionList');
            questionList.appendChild(questionItem);
        });
    }
}


function autofill(Statements, submit) {
    const QBlock = document.querySelectorAll('div.rc-FormPartsQuestion.css-kntsav');

    for (let i = 0; i < QBlock.length; i++) {
        chrome.storage.local.get([Statements[i]], function (result) {

            const ChoiceBlock = QBlock[i].querySelector('.rc-FormPartsQuestion__row.pii-hide.css-rdvpb7');
            const radios = ChoiceBlock.querySelectorAll('input[type="radio"]');
            const checkboxes = ChoiceBlock.querySelectorAll('input[type="checkbox"]');

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
                });
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
