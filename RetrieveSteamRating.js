// ==UserScript==
// @name         Retrieve ID and inject steam review
// @namespace    http://tampermonkey.net/
// @version      2025-05-25
// @description  try to take over the world!
// @author       Goztiek
// @match        secret
// @icon         secret
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      store.steampowered.com

// ==/UserScript==

function injectSteamReviewInfo(previewDiv, reviewDesc, reviewCount) {
    // Construct HTML snippet
    const reviewHTML = `
        <br><b>Note:</b> ${reviewDesc}
        <br><b>Total reviews:</b> ${reviewCount}
    `;

    // Inject at the bottom of preview text
    previewDiv.insertAdjacentHTML("beforeend", reviewHTML);
}

(function() {
    'use strict';
    const targetLinkIndex = 13;

    const date = new Date();
    console.log("STARTING SCRIPT");
    // Get all elements with class "news"
    const newsElements = document.querySelectorAll('.news');

    newsElements.forEach(news => {
        // Find the first element with class "preview-text" inside the news element
        const previewText = news.querySelector('.preview-text');
        if (!previewText) return;

        // Find the first <a> inside preview-text and get its text content
        const firstLink = previewText.querySelector('a');
        if (!firstLink) return;

        const linkText = firstLink.textContent.trim().toLowerCase();

        // If the link text doesn't match "steam", skip
        if (linkText !== 'steam') return;

        // If matched, find the <a class="big-link"> inside the same news block
        const bigLink = news.querySelector('a.big-link');
        const key = bigLink.href;
        const result = localStorage.getItem(key);
        const cache = result ? JSON.parse(result) : null;
        let diffDays = 0;
        if (cache){
            const fetchDate = new Date(cache.fetchDate);
            diffDays = (date - fetchDate) / (1000 * 60 * 60 * 24);;
        }
        if (bigLink && bigLink.href && (!result || diffDays >= 7) ) {
            console.log('Fetching:', bigLink.href);
            fetch(bigLink.href)
                .then(res => res.text())
                .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // List all <a> elements
                const allLinks = doc.querySelectorAll('a');

                // Fetch the a[targetLinkIndex]
                const selectedLink = allLinks[targetLinkIndex];
                if (selectedLink && selectedLink.href) {
                    console.log(`Fetching selected link: [${targetLinkIndex}] ${selectedLink.href}`);
                    fetch(selectedLink.href)
                        .then(res => res.text())
                        .then(innerHTML => {
                        const lines = innerHTML.split('\n');
                        const targetLine = lines[107]; // Line 108 = index 107
                        // Extract App ID using RegExp
                        const match = targetLine.match(/store\.steampowered\.com\/app\/(\d+)\//);
                        if (match && match[1]) {
                            const appId = match[1];
                            const apiUrl = `https://store.steampowered.com/appreviews/${appId}?json=1&language=all&purchase_type=all`;
                            console.log("About to fetch Steam reviews for app ID:", appId);

                            GM_xmlhttpRequest({
                                method: "GET",
                                url: `https://store.steampowered.com/appreviews/${appId}?json=1&language=all&purchase_type=all`,
                                onload: function(res) {
                                    const data = JSON.parse(res.responseText);
                                    const summary = data.query_summary;
                                    const reviewDesc = summary.review_score_desc;
                                    const reviewCount = summary.total_reviews;
                                    console.log("Injecting");
                                    const gameCache = {};
                                    gameCache.appId = appId;
                                    gameCache.reviewDesc = reviewDesc;
                                    gameCache.reviewCount = reviewCount;
                                    gameCache.fetchDate = new Date().toISOString();
                                    localStorage.setItem(key, JSON.stringify(gameCache));
                                    injectSteamReviewInfo(previewText, reviewDesc, reviewCount);
                                },
                                onerror: function(err) {
                                    console.error("Failed to fetch Steam review API:", err);
                                }
                            });
                        } else {
                            console.log('Steam App ID not found on line 108');
                        }
                    });
                }
            });
        } else {
            injectSteamReviewInfo(previewText, cache.reviewDesc, cache.reviewCount);
        }
    });
})();
