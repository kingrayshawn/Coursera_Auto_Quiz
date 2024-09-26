function GetQuestion() {
    const QBlock = document.querySelectorAll('div.rc-FormPartsQuestion.css-kntsav');
    if (!QBlock.length) return;

    let Options = []
    let Statements = []
    let MultiChoice = []
    let QCount = 0

    QBlock.forEach(qb => {
        let statement = qb.querySelector('div.rc-FormPartsQuestion__contentCell.css-ybrhvy').querySelectorAll('span');
        statement = Array.from(new Set(Array.from(statement).map(span => span.innerText))).join('');
        Statements.push(QCount + statement)

        let options = []
        let OptionBlock = qb.querySelectorAll('div.rc-CML.rc-Option__input-text')
        OptionBlock.forEach(opt => {
            let option = opt.querySelector('span').innerText
            options.push(option)
        });
        if (options.length) Options.push(options)

        let multiChoice = []
        const checkbox = qb.querySelectorAll('input[type="checkbox"]');
        if (checkbox.length) multiChoice.push(true)
        const radio = qb.querySelectorAll('input[type="radio"]');
        if (radio.length) multiChoice.push(false)

        if (multiChoice.length) MultiChoice.push(multiChoice)
        QCount++;
    });


    chrome.runtime.sendMessage({ header: "sent questions", Statements: Statements, Options: Options, MultiChoice: MultiChoice });
}

function GetUserChoice() {
    const QBlock = document.querySelectorAll('.rc-FormPartsQuestion__row.pii-hide.css-rdvpb7');

    let Options = []
    QBlock.forEach(qb => {
        let Choice = []
        const radios = qb.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            if (radio.checked) {
                const spanText = radio.nextElementSibling.innerText;
                Choice.push(spanText);
            }
        });
        const checkboxes = qb.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const spanText = checkbox.nextElementSibling.innerText;
                Choice.push(spanText);
            }
        });

        if (Choice.length) Options.push(Choice)
    });


    chrome.runtime.sendMessage({ header: "sent user choice", Options: Options });
}

function GetAnswer() {
    const QBlock = document.querySelectorAll('.rc-FormPartsQuestion__row.pii-hide.css-rdvpb7');

    let Answers = []
    QBlock.forEach(qb => {
        let answers = []
        const GradeFeedback = qb.querySelectorAll('[data-testid="GradeFeedback-caption"]');
        GradeFeedback.forEach(answer => {
            const spanText = answer.innerText;
            answers.push(spanText);
        });

        if (answers.length) Answers.push(answers)
    });


    chrome.runtime.sendMessage({ header: "sent answers", Answers: Answers});
}

const observer = new MutationObserver(() => {
    GetQuestion();
    GetUserChoice();
    setTimeout(() => {
        GetAnswer();
    }, 2000);
});

observer.observe(document.body, { childList: true, subtree: true });

