function GetQuestion() {
    const QBlock = document.querySelectorAll('div.rc-FormPartsQuestion.css-kntsav');
    if (!QBlock.length) return;

    let Options = []
    let Statements = []
    let MultiChoice = []
    let UserChoice = []
    let Answers = []
    let QCount = 1

    QBlock.forEach(QBlock => {
        let statement = GetStatement(QBlock)
        Statements.push(QCount + statement)

        let options = GetOptions(QBlock, check = false)
        Options.push(options)

        let multiChoice = GetMultiChoice(QBlock)
        MultiChoice.push(multiChoice)

        let userChoice = GetOptions(QBlock, check = true)
        UserChoice.push(userChoice)

        let answers = GetAnswer(QBlock)
        Answers.push(answers)

        QCount++;
    });

    console.log("Get Data : ")
    console.log(Statements)
    console.log(Options)
    console.log(MultiChoice)
    console.log(UserChoice)
    console.log(Answers)

    chrome.runtime.sendMessage({ header: "sent questions", Statements: Statements, Options: Options, MultiChoice: MultiChoice, UserChoice: UserChoice, Answers: Answers });
}

function GetStatement(QBlock) {
    let StatementBlock = QBlock.querySelector('div.rc-FormPartsQuestion__contentCell.css-ybrhvy').querySelectorAll('span');
    let statement = "";
    StatementBlock.forEach(span => {
        if (span.querySelectorAll('span').length === 0 && span.innerText != "") {
            statement += span.innerText;
        }
    });

    return statement;
}


function GetMultiChoice(QBlock) {
    let multiChoice = []
    const checkbox = QBlock.querySelectorAll('input[type="checkbox"]');
    const radio = QBlock.querySelectorAll('input[type="radio"]');
    if (checkbox.length) multiChoice.push(true);
    if (radio.length) multiChoice.push(false);
    return multiChoice;
}

function GetOptions(QBlock, check) {
    const ChoiceBlock = QBlock.querySelector('.rc-FormPartsQuestion__row.pii-hide.css-rdvpb7');

    let options = []
    const radios = ChoiceBlock.querySelectorAll('input[type="radio"]');
    const checkboxes = ChoiceBlock.querySelectorAll('input[type="checkbox"]');

    if (radios.length) {
        radios.forEach(radio => {
            const spanText = radio.nextElementSibling.innerText;
            if (check) {
                if (radio.checked) options.push(spanText);
            } else {
                options.push(spanText);
            }
        });
    } else if (checkboxes.length) {
        checkboxes.forEach(checkbox => {
            const spanText = checkbox.nextElementSibling.innerText;
            if (check) {
                if (checkbox.checked) options.push(spanText);
            } else {
                options.push(spanText);
            }
        });
    }
    return options;
}

function GetAnswer(QBlock) {
    const AnswerBlock = QBlock.querySelector('.rc-FormPartsQuestion__row.pii-hide.css-rdvpb7');

    let answers = []
    const GradeFeedback = QBlock.querySelectorAll('[data-testid="GradeFeedback-caption"]');
    GradeFeedback.forEach(answer => {
        const spanText = answer.innerText;
        answers.push(spanText);
    });
    return answers;
}


let debounceTimeout = null;

const observer = new MutationObserver(async () => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        GetQuestion();
    }, 2000);
});

observer.observe(document.body, { childList: true, subtree: true });