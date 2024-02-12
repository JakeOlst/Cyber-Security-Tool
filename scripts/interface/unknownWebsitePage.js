document.addEventListener('DOMContentLoaded', function() {
    let params = new URLSearchParams(window.location.search);
    let blockedFromURL = params.get('blockedFromURL');

    if (blockedFromURL != null && blockedFromURL != "") {
        const blockURL = document.getElementById('URL');
        blockURL.textContent = blockedFromURL;
    }
});

