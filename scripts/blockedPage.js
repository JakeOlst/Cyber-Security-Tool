const corsProxy = 'https://corsproxy.io/?'; // Temp way to bypass CORS restrictions during project //

document.addEventListener('DOMContentLoaded', function() {
    let params = new URLSearchParams(window.location.search);
    let blockedFromURL = params.get('blockedFromURL');
    let categories = params.get('blockCategories').split(','); 

    fetch('../config.json')
    .then(response => response.json())
    .then(data => {
        const filteredCategories = data.typesOfThreat.filter (
            category => {
                return categories.includes(category.threatCode[0]);
            }
        )
        console.log("Categories: "+filteredCategories);
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