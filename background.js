chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' ) {
    if (tab.url.includes("/s/")){
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["./product.js"]
    })
        .then(() => {
            console.log("etrekse to product script.");
        })
        .catch(err => console.log(err));
    }
    else if (tab.url.includes("/c/") || tab.url.includes("gr/search?")){
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["./search.js"]
    })
        .then(() => {
            console.log("etrkse to search script.");
        })
        .catch(err => console.log(err));
    }
    else if (tab.url.includes("skroutz.gr/cart")){
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["./cart.js"]
    })
        .then(() => {
            console.log("etrkse to cart script.");
        })
        .catch(err => console.log(err));
    }
      
  }
});
