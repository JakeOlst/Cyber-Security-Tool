document.addEventListener('DOMContentLoaded', function() {
    let params = new URLSearchParams(window.location.search);
    let categories = params.get('blockCategories').split(','); 
    let blockedFromURL = params.get('blockedFromURL');

    document.getElementById('blockCategories').textContent = 'Categories: '+categories.join(',');
    document.getElementById('blockedFromURL').textContent = 'Blocked URL: '+blockedFromURL;
});