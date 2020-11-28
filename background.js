// Refer to https://github.com/mozilla/pdf.js/blob/master/extensions/chromium/pdfHandler.js

function getViewerURL(url) {
    const viewerPage = 'index.html';
    console.log(chrome.extension.getURL(viewerPage) +
    '?file=' + encodeURIComponent(url));
    return chrome.extension.getURL(viewerPage) +
        '?file=' + encodeURIComponent(url);
}

function getHeaderFromHeaders(headers, headerName) {
    for (var i = 0; i < headers.length; ++i) {
        var header = headers[i];
        if (header.name.toLowerCase() === headerName) {
            return header;
        }
    }
    return undefined;
}

function isPdfFile(details) {
    var header = getHeaderFromHeaders(details.responseHeaders, "content-type");
    if (header) {
        var headerValue = header.value.toLowerCase().split(";", 1)[0].trim();
        if (headerValue === "application/pdf") {
            return true;
        }
        if (headerValue === "application/octet-stream") {
            if (details.url.toLowerCase().indexOf(".pdf") > 0) {
                return true;
            }
            var cdHeader = getHeaderFromHeaders(
                details.responseHeaders,
                "content-disposition"
            );
            if (cdHeader && /\.pdf(["']|$)/i.test(cdHeader.value)) {
                return true;
            }
        }
    }
    return false;
}

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        //   if (isPdfDownloadable(details))
        //     return;

        // console.log(details);

        return { redirectUrl: getViewerURL(details.url) };
    },
    {
        urls: [
            'http://*/*.pdf',
            'https://*/*.pdf',
            'file://*/*.pdf',
            'http://*/*.PDF',
            'https://*/*.PDF',
            'file://*/*.PDF'
        ],
        types: ['main_frame']
    },
    ['blocking']);

chrome.webRequest.onHeadersReceived.addListener(
    function (details) {
        console.log(details);

        if (details.method !== "GET") {
            // Don't intercept POST requests until http://crbug.com/104058 is fixed.
            return undefined;
        }
        if (!isPdfFile(details)) {
            return undefined;
        }
        
        console.log("is pdf");

        // Implemented in preserve-referer.js
        // saveReferer(details);

        return { redirectUrl: getViewerURL(details.url) };
    },
    {
        urls: ["<all_urls>"],
        types: ["main_frame"],
    },
    ["blocking", "responseHeaders"]
);