let elems = document.querySelectorAll("tr.crazy-title-row");
let products = [];
for (let e of elems) {
  let name = e.innerText.replace(/\s*\b[\w\.\d]+\s*$/, "");
  let price_string =
    e.parentElement.parentElement.parentElement.getElementsByClassName(
      "after-price"
    )[0].innerText;
  //let prod=
  products.push({ name: name, price: price_string });
  let skus;
}
let urls=[];
for (let p of products){
    urls.push("https://www.skroutz.gr/search.json?keyphrase="+p.name)
}
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type=="done"){
        skus=message.data;
        console.log("products taken");
        sendResponse("ok");
    }
  });

chrome.runtime.sendMessage({ type: "getData", input: urls });






/*

chrome.runtime.sendMessage({url: urls}, (response) => {console.log(response);
    console.log(response.message);
  });

(async () => {
    const response = await chrome.runtime.sendMessage({url: urls});
    // do something with response here, not outside the function
    console.log(response.message);
    console.log(response.data);
  })();
chrome.runtime.sendMessage({
    url: urls,
  }, function(response) {
    console.log(response);
  });

const proxyUrl = 'https://esop.haroldpoi.repl.co/post_json';
surl=[];
for (let p of products){
    let u="https://www.skroutz.gr/search.json?keyphrase="+p.name;
    surl.push(u);
}

fetch(proxyUrl, {
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST',
    cache: 'no-cache',
    redirect: 'follow',
    referrer: 'no-referrer',
    body: JSON.stringify({
      url: surl
    })
  })
    .then(response => response.json())
    .then(data => {console.log(data);
      // process the data here
    })
    .catch(error => {
      console.error(error);
    });
  


for (let u of surl){
  
}



let r;
fetch(url, {
  headers: {
    authority: "www.skroutz.gr",
  },
}).then((response) => (r = response));


let r;
fetch(url, {
  headers: {
    authority: "www.skroutz.gr",
  },
  proxy: 'https://cors-anywhere.herokuapp.com/'
}).then((response) => (console.log(response)));

let surl="https://www.skroutz.gr/search.json?keyphrase=TV LG 32LQ630B6LA 32'' LED HD READY SMART WIFI 2022";

const proxyUrl = 'https://esop.haroldpoi.repl.co/post_json';
fetch(proxyUrl, {
  headers: {
    'Content-Type': 'application/json'
  },
  method: 'POST',
  mode: 'cors',
  credentials: 'include',
  cache: 'no-cache',
  redirect: 'follow',
  referrer: 'no-referrer',
  body: JSON.stringify({
    url: surl
  })
})
  .then(response => response.json())
  .then(data => {
    // process the data here
  })
  .catch(error => {
    console.error(error);
  });
  */