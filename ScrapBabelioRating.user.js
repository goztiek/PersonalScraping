// ==UserScript==
// @name         Parse audiobooks
// @namespace    http://tampermonkey.net/
// @version      2025-03-18
// @description  try to take over the world!
// @author       Goztiek
// @match        HIDDEN
// @grant        GM_xmlhttpRequest
// @grant GM_setValue
// @grant GM_getValue
// ==/UserScript==
const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.89 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:110.0) Gecko/20100101 Firefox/110.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/604.1",
    "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/537.36"
];

function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function getFirstGoogleResult(query, callback) {
    GM_xmlhttpRequest({
        method: "GET",
        url: "https://www.google.com/search?q=" + encodeURIComponent(query),
        headers: {
            "User-Agent": getRandomUserAgent(),
            "Referer": "https://www.google.com/"
        },
        onload: function(response) {
            let parser = new DOMParser();
            let doc = parser.parseFromString(response.responseText, "text/html");

            let firstLink = doc.querySelector("a[href^='https://www.babelio.com']");
            if (firstLink) {
                callback(firstLink.href, query);
            } else {
                console.log("Google search request failed:", "https://www.google.com/search?q=" + encodeURIComponent(query));
            }
        },
        onerror: function(error) {
            console.error("Google search request failed:", query);
        }
    });
}

function getRatingFromBabelio(url, string) {
    GM_xmlhttpRequest({
        method: "GET",
        url: url,
        onload: function(response) {
            let parser = new DOMParser();
            let doc = parser.parseFromString(response.responseText, "text/html");

        let ratingElement = doc.querySelector(".rating[itemprop='ratingValue']");

        if (ratingElement) {
            let ratingValue = ratingElement.textContent.trim();
            console.log(string + ": " + ratingValue);
        } else {
            console.log("Babelio Parsing Failed: ", url);
        }
        },
        onerror: function(error) {
            console.error("Failed to fetch first result page:", error);
        }
    });
}

(function() {
    'use strict';

    window.onload = function() {
        let elements = document.getElementsByClassName("font-bold mb-2");
        let list = [...elements].map(el => el.innerText);
        list.forEach(el => el + ": " + getFirstGoogleResult(el + " Babelio", getRatingFromBabelio));
    }
})();
