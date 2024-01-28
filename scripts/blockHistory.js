document.addEventListener('DOMContentLoaded', function () {
    fetch('../config/config.json')
    .then(response => response.json())
    .then(data => {
        const threatDetails = data.typesOfThreat;
        chrome.storage.local.get({ blockHistory: [] }, function (result) {
            const blockHistory = result.blockHistory;
            const blockListTable = document.getElementById('blockListTable');
            const blockListBody = document.getElementById('blockListBody'); 

            blockHistory.forEach(function (entry) {
                let url = entry.blockedURL;
                let categories = entry.blockCategories.split(',');
                let timestamp = entry.timestamp;

                const categoryDetails = threatDetails.filter(category => {
                    return categories.some(cat => category.threatCode.includes(cat.trim()));
                });

                const row = blockListBody.insertRow(-1); 
                const urlCell = row.insertCell(0);
                const categoriesCell = row.insertCell(1);
                const timestampCell = row.insertCell(2);

                urlCell.innerHTML = url;

                const categoryDetailsHTML = categoryDetails.map(category => {
                    return `<strong>${category.threatName}</strong>: ${category.description}`;
                }).join('<br><br>');
                categoriesCell.innerHTML = categoryDetailsHTML;

                timestampCell.innerHTML = formatTimestamp(timestamp);
            });
        });
    })
    .catch(error => {
        console.error('Error fetching threat details:', error);
    });
});

function formatTimestamp(timestamp) {
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }
    const formattedTimestamp = new Date(timestamp).toLocaleString('en-GB', options)
    return formattedTimestamp;
}