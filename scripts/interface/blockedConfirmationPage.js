document.addEventListener('DOMContentLoaded', function () {
    let params = new URLSearchParams(window.location.search);
    let blockedFromURL = params.get('blockedFromURL');
    let categories = params.get('blockCategories').split(','); 

    if (blockedFromURL != null && blockedFromURL != "") {
        const blockURL = document.getElementById('URL');
        blockURL.textContent = blockedFromURL;
    }

    var checkbox = document.getElementById('confirmationMessage');

    var additionalContent = document.getElementById('checkboxHiddenButtons');

    checkbox.addEventListener('change', function () {
        if (checkbox.checked) {
            additionalContent.style.display = 'block';
        } else {
            additionalContent.style.display = 'none';
        }
    });

    const returnToSearch = document.getElementById('returnToSearch');
    returnToSearch.addEventListener('click', function() {
        history.back();
        history.back();
    });

    const navToEducation = document.getElementById('navToEducation');
    navToEducation.addEventListener('click', function() {
        const redirectPageURL = 'userEducationMenu.html';
        window.location.href = redirectPageURL;
    });

    const continueButton = document.getElementById('continueToWebsite');
    continueButton.addEventListener('click', function() {
        if (!blockedFromURL.startsWith("https://") && !blockedFromURL.startsWith("https://")) {
            window.location.href = "https://"+blockedFromURL;
        }
        else {
            window.location.href = blockedFromURL;
        }
    });

    fetch('../config/config.json')
    .then(response => response.json())
    .then(data => {
        const filteredCategories = data.typesOfThreat.filter (
            category => {
                return category.threatCode.some(code => categories.includes(code));
            }
        )
        const threatsTable = document.getElementById('threatsTable');
        filteredCategories.forEach(
            category => {
                const row = threatsTable.insertRow();
                const cell1 = row.insertCell(0);
                cell1.textContent = category.threatName;
                const cell2 = row.insertCell(1);
                cell2.textContent = category.description;
            }
        )

    })
    .catch(error => {
        console.error('There was an error fetching the config.json file. Details:',error);
    });
});
