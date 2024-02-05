import { queryURLScanIOResult } from "./urlScanIOResultModule.js";

function queryURLScanIOSubmit(url, details, tabInfo, lastNavURL) {
    const apiEndpoint = 'https://urlscan.io/api/v1/scan/';
    const apiKey = '9a05d09b-6284-41ae-97b0-0648173b00a4';
    const postData = {
        url: url,
        visibility: 'public',
    }

    fetch((apiEndpoint), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'API-Key': apiKey,
        },
        body: JSON.stringify(postData),
    })
    .then(response => response.json())
    .then(data => {
        console.log("URL successfully submitted to URLScan.io. Response: ",data);
        if (data.uuid) {
            // A timeout is added for 10 seconds, as per the documentation for the API. //
            setTimeout(() => queryURLScanIOResult(data.uuid,details, tabInfo, lastNavURL), 10000)
        }
    })
    .catch(error => {
        console.error('There was an error querying URLScan.IO API:', error);
    });
}


export {
    queryURLScanIOSubmit
};