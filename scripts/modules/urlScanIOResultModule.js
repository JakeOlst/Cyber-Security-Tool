import { navigateBasedOnAPIResults } from "./resultNavigationModule.js";

// The 'score' threshold for URLScan.IO API: -100 (legitimate) to 100 (illegitimate). Default is 30 to avoid false positives.
// Lowering for testing.
const urlScanMaxScore = 30;
const maxRetries = 8;
const apiKey = '9a05d09b-6284-41ae-97b0-0648173b00a4';

function queryURLScanIOResult(uuid, details, tabInfo, lastNavURL)
{
    let retries = 0;
    const apiEndpoint = 'https://urlscan.io/api/v1/result/'+uuid+'/';

    getResults(uuid);

    function getResults(uuid) {

        fetch((apiEndpoint), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'API-Key': apiKey,
            },
        })
            .then(response => response.json())
            .then(data => {
                //console.log("Result requested from URLScan.io");
                if (data.verdicts) {
                    console.log('URLScan.IO Response:', data);
                    if (data.verdicts.urlscan.score > urlScanMaxScore) {
                        tabInfo[details.tabId].urlScanSafeResult = false;
                        let categoriesArr = data.verdicts.urlscan.categories;
                        let categories = "NEGATIVE_REPUTATION_SCORE";
                        while (categoriesArr.length > 0) {
                            categories = categories+","+categoriesArr.pop();
                        }
                        
                        tabInfo[details.tabId].urlScanCategories = categories;
                        navigateBasedOnAPIResults(details, data.page.url, false, tabInfo, lastNavURL)
                    }
                    else {
                        tabInfo[details.tabId].urlScanSafeResult = true;
                        //console.log(tabInfo[details.tabId].urlScanSafeResult);
                        navigateBasedOnAPIResults(details, data.page.url, true, tabInfo, lastNavURL)
                    }
                }
                else if ((data.status == 404) || (data.status == 200 && !data.verdicts)) {
                    console.log("retries:"+retries);
                    if (retries <= maxRetries) {
                        console.log("URLScan.IO Results Page not yet ready. Retrying in 2 seconds."+(maxRetries-retries)+" retries remaining.")
                        retries++;
                        setTimeout(() => getResults(uuid), 2000)
                    }
                    else {
                        throw new Error('Error querying URLScan.IO API: Max Retries attempted.');
                    }
                }
                else {
                    throw new Error('UUID not received from URLScan.IO')
                }

            })
            .catch(error => {
                console.error('Error querying URLScan.IO API:', error);
            }
        );
    }
}

export {
    queryURLScanIOResult
};