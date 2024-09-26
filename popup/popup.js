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
                args: [Statements, Options, MultiChoice, false]
            });
        });
    });
    document.getElementById('fillandsubmit').addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: autofill,
                args: [Statements, Options, MultiChoice, true]
            });
        });
    });
});


function show_on_popup(statements, options, multiChoice) {
    if(!options.length) {
        const questionList = document.getElementById('questionList');
        questionList.innerText = "do it first"
        return;
    }
    
    Statements = statements.slice();
    Options = options.slice();
    MultiChoice = multiChoice.slice();

    console.log("Get Question (Popup)");
    console.log(Statements)
    console.log(Options)
    console.log(MultiChoice)

    for (let i = 0; i < Statements.length; i++) {
        chrome.storage.local.get([Statements[i]], function (result) {
            let ansIndex = "";
            if(result[Statements[i]] && MultiChoice[i].length) {
                for (let answer of result[Statements[i]]) {
                    ansIndex += Options[i].indexOf(answer) + 1;
    
                    if (!MultiChoice[i][0]) break;
                }
            }else{
                ansIndex = "不知道自己想";
            }
            
            const questionItem = document.createElement('div');
            questionItem.innerText = `${i + 1} : ${ansIndex}`;

            const questionList = document.getElementById('questionList');
            questionList.appendChild(questionItem);
        });
    }
}


function autofill(Statements, Options, MultiChoice, submit) {
    const QBlock = document.querySelectorAll('.rc-FormPartsQuestion__row.pii-hide.css-rdvpb7');

    for (let i = 0; i < Statements.length; i++) {
        chrome.storage.local.get([Statements[i]], function (result) {
            if(result[Statements[i]] && MultiChoice[i].length) {
                for (let answer of result[Statements[i]]) {
                    let spans = QBlock[i].querySelectorAll('span');
                    let targetSpan = Array.from(spans).find(span => span.innerText == answer);
                    let inputButton = targetSpan.closest('div').querySelector('input[type="radio"], input[type="checkbox"]');
                    if(!inputButton.checked) inputButton.click();

                    if (!MultiChoice[i][0]) break;
                }
            }
        });
    }

    let signed = document.getElementById('agreement-checkbox-base')
    if(!signed.checked) signed.click();

    if (submit) {
        setTimeout(() => {
            document.querySelector('button[data-test="submit-button"]').click();
        }, 1000);
        
    }
}
