document.addEventListener('DOMContentLoaded', function() {
    const issueForm = document.getElementById('issueForm');
    issueForm.addEventListener('submit', function(event) {
        event.preventDefault(); 
        
        const formData = new FormData(issueForm);

        const subject = formData.get('subject');
        const emailType = formData.get('emailType');
        const summary = formData.get('summary');
        const attachments = formData.get('attachments');

        const emailBody = `Type: ${emailType}\n\nSummary: ${summary}`;

        const emailLink = `mailto:cstoolproject@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
        window.location.href = emailLink;
    });
});
