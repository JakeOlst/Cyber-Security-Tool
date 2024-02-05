document.addEventListener('DOMContentLoaded', function() {
    let params = new URLSearchParams(window.location.search);
    let blockedFromURL = params.get('blockedFromURL');
    let categories = params.get('blockCategories').split(','); 

    if (blockedFromURL != null && blockedFromURL != "") {
        const blockURL = document.getElementById('URL');
        blockURL.textContent = blockedFromURL;
    }

    const continueButton = document.getElementById('nextPage');
    continueButton.addEventListener('click', function() {
        const redirectPageURL = 'blockedConfirmationPage.html?blockedFromURL='+blockedFromURL+'&blockCategories='+params.get('blockCategories');
        window.location.href = redirectPageURL;
    });

    const returnToSearch = document.getElementById('returnToSearch');
    returnToSearch.addEventListener('click', function() {
        history.back();
    });

    fetch('../../config/threatTypes.json')
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
        console.error('There was an error fetching the threatTypes.json file. Details:',error);
    });
});

