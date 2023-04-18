// Create a style element
const style = document.createElement("style");

// Add the CSS rules as the text content of the style element
style.innerHTML = `
  .grafima{
    display: none;
    height: 500px;

  }
  .chart-popup{
    display: none;
    position: fixed;
    top: 200px;
    left: 50px;
    width: 400px;
    height: auto;
    z-index: 50;
    background-color: white;
  }
  .closing-icon{
    position: absolute;
    height: 32px;
    width: 32px;
    top: 0;
    right: 0;
  }
  .koumpia{
    top:0;
    left:0;
    margin-left: auto;
  }
  .loading-icon {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    border: 2px solid #ccc;
    border-radius: 50%;
    border-top-color: #333;
    animation: spin 1s linear infinite;
  }
`;
let pop;
let lastel;
let nodes=[];
document.head.appendChild(style);
let timePeriods = ["all", "6_months", "3_months", "1_months"];

let day = new Date().getDate();
let getPos=(minEver,pr)=>{
  if (minEver==0) return null;
  else return (((minEver - pr) / minEver) * 100).toFixed(2)};
function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    /* if present, the header is where you move the DIV from:*/
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    /* otherwise, move the DIV from anywhere inside the DIV:*/
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

let settings = JSON.parse(localStorage.getItem("vanced-graph-settings"));
if (settings == null) {
  settings = {
    autoLoadGraphs: true,
    autoSortProducts: false,
    limit: -10,
    autoHideGraphs: false,
  };
  localStorage.setItem("vanced-graph-settings", JSON.stringify(settings));
}

function isSpons(elem) {
  if (!elem.hasOwnProperty("querySelector")) return false;
  if (
    elem.querySelector("li span.label-text") ||
    elem.querySelector("label-text")
  )
    return true;
  else return false;
}
function blurSp() {
  let elementsToRemove = document.querySelectorAll("li span.label-text");
  if (elementsToRemove.length == 0)
    elementsToRemove = document.querySelectorAll("label-text");

  // Step 2: Check if any elements were found
  if (elementsToRemove.length > 0) {
    // Step 3: Iterate over all filtered elements and remove them one by one
    for (let element of elementsToRemove) {
      let parentElement = element.parentElement.parentElement.parentElement;
      //parentElement.remove();
      parentElement.style.filter = "blur(5px)";
      parentElement.style.opacity = "0.1";
      parentElement.style.display = "none";
    }
  }
}
let n = JSON.parse(localStorage.getItem("graphs"));
if (n == null) {
  n = {};
  localStorage.setItem("graphs", JSON.stringify(n));
}
function cleanNdict(){
for (let key in n){
  if (n[key].hasOwnProperty("url")) delete n[key].url
  if (n[key].day!=day) delete n[key]
}

localStorage.setItem("graphs", JSON.stringify(n));
}

cleanNdict();
var h1 = document.getElementsByClassName("page-title")[0];
if (typeof h1 == "undefined") {
  h1 = document.querySelector("#site-header > div");
}
var koumpia = document.createElement("div");
koumpia.className = "koumpia";
koumpia.style.marginLeft = "1em";
//koumpia.style.maxWidth="25%"
koumpia.style.display = "-webkit-inline-box";
//koumpia.style.alignItems = "flex-start";
h1.appendChild(koumpia);
let nowurl = document.baseURI;
let lists;
let graphsLoaded = false;
if (typeof button == "undefined") {
  addGraphButton(koumpia);
  addSortButton(koumpia);
  addDealsButton(koumpia);
  addScanButton(koumpia);
  addFilterButton(koumpia);
  computeSortedGraphs().then(() => {
    //console.log("fortwsa");
  });
  //addButton(h1);
  //addSortButton(h1);
  //console.log("evala koumpi gia grafima kai gia sorting");
}


async function computeSortedGraphs() {
  graphsLoaded = false;
  lists = findLists();
  graphPromises=[];
  nodes=[];
  for (let l of lists) {
    if (
          Array.from(l.children).some(
            (x) => x.clientHeight < 300 || x.clientWidth < 200
          )
        ) {
          l.style.alignItems = "flex-start";
        }
    // if (settings.autoLoadGraphs) 
   //await getNodesGraphs(l.children)
  nodes.push(...l.children)
   graphPromises.push(getNodesGraphs(l.children));
   //showGraphs(l.children)
  }
  await Promise.all(graphPromises);
  for (let l of lists) {showGraphs(l.children)}
  if (settings.autoSortProducts) sortPage();
  //fetchNextPage()
  if (!nowurl.includes("/s")) {
    fetchNextPage().then(() => {
      localStorage.setItem("graphs", JSON.stringify(n));
    });
  }
}
const targetNode = lists[0];
const observer = new MutationObserver(async (mutations) => {
  //console.log("updated");
  //console.log(mutations.filter(x=>x.addedNodes.length>0));
// if (){
  
//   if (
//     Array.from(l.children).some(
//       (x) => x.clientHeight < 300 || x.clientWidth < 200
//     )
//   ) {
//     l.style.alignItems = "flex-start";
//   }
// }
  if (mutations.some(x=>x.addedNodes.length>0 && x.target.baseURI!=nowurl)){
  try {blurSp()
    await computeSortedGraphs()
    nowurl=document.baseURI;
  }
    catch (err){
      console.error(err);
    }

  }
  // if (mutations.some((x) => x.target.baseURI != nowurl)) {
  //   //console.log("namaste");
  //   nowurl = document.baseURI;
  //   //console.log("nea selida");
  //   blurSp();
  //   await computeSortedGraphs();
  // }
  if (
    mutations.length > 10 &&
    nowurl == "https://www.skroutz.gr/" &&
    mutations.some(
      (x) =>
        x.target.className == "home-timeline-posts" && x.addedNodes.length > 5
    )
  ) {
    await computeSortedGraphs();
    //console.log(mutations);
    //await getNodesGraphs(document.body.getElementsByTagName("li"));
  }

});

// Configure the observer to watch for childList and attribute changes
const config = { childList: true, attributes: true, subtree: true };

// Start observing the target node for configured mutations
observer.observe(document, config);
const awaitTimeout = delay =>
  new Promise(resolve => setTimeout(resolve, delay));

async function fetchDataOld(url) {
  if (!url.includes(".json")) {
    url = url.replace("?", ".json?");
  }
  let res;
  let data;
  try{
   res = await fetch(url);
   data = await res.json();}
   catch(err){
    await awaitTimeout(1000);
    data= await fetchData(url);
   }
  return data;
}

const retryDelay = (retryCount) => {
  return Math.pow(2, retryCount) * 100;
}
async function fetchData(url, retries = 0) {
  if (!url.includes(".json")) {
    url = url.replace("?", ".json?");
  }
  let res;
  let data;
  try{
    res = await fetch(url, { timeout: 5000 });
    data = await res.json();
  } catch (err) {
    if (retries < 5) {
      const delay = retryDelay(retries);
      //console.log(`Retrying ${url} in ${delay}ms, retry count: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      data = await fetchData(url, retries + 1);
    } else {
      //console.log(`Failed to fetch ${url} after 5 retries`);
      //throw err;
    }}
  return data;}

async function fetchAllUrls(urls) {
  let promises = [];
  for (let u of urls) {
    //fetch data for every url, put it it in the promises list
    promises.push(fetchData(u));
  }
  const results = await Promise.all(promises);
  return results;
}
async function fetchAllUrlsOld(urls) {
  let results = [];
  let retry = {};
  const maxRetries = 5;
  for (let url of urls) {
    let response;
    if (!retry[url]) {
        retry[url] = 0;
    }
    while (response === undefined || response.status === 'rejected' && retry[url] < maxRetries) {
        if (response && response.status === 'rejected') {
            await new Promise(res => setTimeout(res, 300));
            retry[url]++;
        }
        response = await fetchData(url);
    }
    if (response.status === 'fulfilled') {
        results.push(response.value);
    } else {
        console.log(`Failed to fetch ${url} after ${maxRetries} retries`);
    }
  }
  return results;
}


function nextPage() {
  let a = new URLSearchParams(document.location.search);
  let page = a.get("page");
  if (page == null) {
    page = 1;
  }
  page++;
  a.set("page", page);
  let b =
    document.location.origin + document.location.pathname + "?" + a.toString();
  if (!b.includes(".html")) {
    b = b.replace("?", ".html?");
  }
  return b.replace(".html", ".json");
}

async function getSkus(url) {
  //let url; //vale to url tis selidas
  url = url.replace(".html", ".json");
  let res;
  try{
  res= await fetch(url);
  }
  catch{return null;}
  if (res.status != 200) return null;
  let data = await res.json();

  //let data = await fetchData(url);
  let ret = [];
  let skus = data.skus;
  if (skus) {
    for (let i = 0; ; i++) {
      //AUTO THELEI ALLAGI
      if (i == skus.length) break;
      let s = skus[i];
      if (s.sku_url.includes("?from=featured")) {
        skus.shift();
        i--;
      } else {
        ret.push({
          price: s.price,
          title: s.name,
          url: s.sku_url.replace(/.html.*/, "/price_graph.json"),
          skuid: s.id,
        });
      }
    }
  } else {
    //exoume html elements anti gia pinaka apo json
    let test = document.createElement("div");
    test.innerHTML = data.cards;
    let nds = Array.from(test.getElementsByTagName("li"));
    ret = nds.map((x) => getProductDetails(x));
  }
  ret = ret.filter((x) => x != null);
  return ret;
}
async function getPageGraphs(pageurl) {
  let skus = await getSkus(pageurl);
  if (skus == null || skus.length == 0) {
    return null;
  }
  skus = skus.filter((x) => !hasRecentGraph(x.skuid, x.price));
  let urls = skus.map((x) => x.url);
  let graphsdata = await fetchAllUrls(urls);
  //graphsdata.filter(x=>x!={})
  for (let i = 0; i < graphsdata.length; i++) {
    if (graphsdata[i] != {}) createGraphDataFromJSON(graphsdata[i], skus[i]);
  }
  return skus;
}

function createGraphDataFromJSON(data, a) {
  // if (product.getElementsByTagName("canvas").length) {
  //   return null;
  // }
  //if (isSpons(product)) continue;
  //let url = a.url;
  let pric=a.price;
  //pairnw price ws string opote to metatrepw
  let current_price;
  try{
    current_price= parseFloat(
      pric
        .match(/[\d,\.]+/)[0]
        .replace(".", "")
        .replace(",", ".")
    );
  }
  catch (err){
    return null;
  }

  //let link = url;
  var ret;
  let minEver;
  //return new Promise((resolve, reject) => {
  // // Load the data for the product
  // fetch(link)
  //   .then((response) => response.json())
  //   .then((data) => {
  // Extract the data for each time period
  //const minEver = data["min_price"]["min"];
  let timePeriods;
  try {
    timePeriods = Object.keys(data["min_price"]["graphData"]);
  } catch {
    //resolve(null);
    return null;
  }
  timePeriods.reverse();
  const meanPrices = [];
  const medianPrices = [];
  const stdevPrices = [];
  const minPrices = [];
  const minStamps = [];
  timePeriods.forEach((period) => {
    const values = data["min_price"]["graphData"][period]["values"];

    const prices = values.map((v) => v["value"]).filter((p) => p !== 0.0);
    //VGAZEI OLES TIS PROSFATES TIMES POU EINAI ISES ME TIN TWRINI TIMI
 
    let minpr=null;
    let minprelements;
    if (prices.length == 0) {
      minpr = null;
      meanPrices.push(null);
      medianPrices.push(null);
      stdevPrices.push(null);
      minPrices.push(minpr);
      minStamps.push(null);
    } else {
      if (period=="1_months"){
        let clonepr=structuredClone(values).filter(v=>v["value"]!=0)
        while (clonepr.at(-1) && clonepr.at(-1)["value"] == current_price) clonepr.pop();
        
        minpr=Math.min(...clonepr.map(x=>x["value"]))
        minprelements = clonepr
        .filter((x) => x.value == minpr)
        .map((x) => x.timestamp);
      }
      else{ minpr = Math.min(...prices);
      minprelements = values
        .filter((x) => x.value == minpr)
        .map((x) => x.timestamp);}
      let tm = null;
      if (minprelements.length > 0) {
        tm = minprelements.at(-1);
      }

      let mean = parseFloat(d3.mean(prices).toFixed(2));
      let median = parseFloat(d3.median(prices).toFixed(2));
      let std;
      try {
        std = parseFloat(d3.deviation(prices).toFixed(2));
      } catch {
        std = null;
      }
      //console.log(mean, median, std)
      meanPrices.push(mean);
      medianPrices.push(median);
      stdevPrices.push(std);
      minPrices.push(minpr);
      minStamps.push(tm);
    }
  });
  //let timi_el;
  minEver = Math.min(...minPrices.filter((x) => x != null));
  let pos=parseFloat(getPos(minEver, current_price))
  let minind = minPrices.indexOf(minEver);
  let ltimestamp;
  try {
    ltimestamp = minStamps[minind];
  } catch {
    ltimestamp = 1;
  }
  // product.appendChild(gram);
  let graphdata = {
    mean: meanPrices,
    median: medianPrices,
    std: stdevPrices,
    min: minPrices,
  };
  ret = {
    graphdata: graphdata,
    title: a.title,
    minpr: minEver,
    lastTimestamp: ltimestamp,
    day: day,
    price: current_price,
    pososto:pos,
    id:a.skuid
  };
  //console.log(ret);
  n[a.skuid] = ret;
  return ret;

}


function getList() {
  try {
    li = document.querySelector("#sku-list");
    kin = li.children;
    //return document.querySelector("#sku-list").children;
    return li;
  } catch {
    //pairnw ti lista an eimai sti selida prosfores
    kin = document.getElementsByClassName("js-sku cf card ");
    if (kin.length) {
      //return document.getElementsByClassName("js-sku cf card ");
      return kin[0].parentElement;
    } else {
      //pairnw ti lista an eimai sti selida agapimena
      li = document.getElementsByClassName("js-favorites-list");
      if (li.length) {
        kin = li[0].getElementsByTagName("li");
        //return document.getElementsByClassName("js-favorites-list")[0].getElementsByTagName("li");
        return li[0];
      }
    }
    //if (kin.length) return kin;
    return null;
  }
}

function getGraphsOLD() {
  let kin = getList().children;
  if (kin == null) return null;
  //let pososta=[];
  elementStyle = getComputedStyle(kin[0]);
  //GIA STATISTIKA KANW LOAD TO D3 KAI GIA TO CHART TO MIN CHART
  // Loop through each product in the table
  for (let i = 0; i < kin.length; i++) {
    //elegxos an yparxei idi grafima, an nai proxwraei sto epomeno stoixeio
    if (kin[i].getElementsByTagName("canvas").length) {
      continue;
    }
    if (isSpons(kin[i])) continue;

    let link;
    try {
      for (let item of kin[i].getElementsByClassName("js-sku-link")) {
        link = item.href;
        if (link != "undefined") {
          link = link.replace(/.html.*/, "/price_graph.json");
          break;
        }
      }
    } catch {
      continue;
    }

    // Load the data for the product
    fetch(link)
      .then((response) => response.json())
      .then((data) => {
        // Extract the data for each time period
        //const minEver = data["min_price"]["min"];
        kin[i].getElementsByClassName;
        const timePeriods = Object.keys(data["min_price"]["graphData"]);
        timePeriods.reverse();
        const meanPrices = [];
        const medianPrices = [];
        const stdevPrices = [];
        const minPrices = [];
        const minTexts = [];
        timePeriods.forEach((period) => {
          const values = data["min_price"]["graphData"][period]["values"];
          if (period == "1_months") {
            values.pop();
          }

          const prices = values.map((v) => v["value"]).filter((p) => p !== 0.0);
          // if (period!="all"){
          //  prices.slice()
          // }

          const minpr = Math.min(...prices);
          let minprelements = values
            .filter((x) => x.value == minpr)
            .map((x) => x.timestamp);
          let imerominia = "";
          if (minprelements.length > 0) {
            imerominia = new Date(minprelements.at(-1) * 1000).toDateString();
          }
          //const imerominia=new Date(minprelements.at(-1).timestamp*1000).toDateString();
          //const txt=`${minprelements.length} φορές. Τελευταία: ${imerominia}`
          //console.log(prices);
          meanPrices.push(d3.mean(prices));
          medianPrices.push(d3.median(prices));
          stdevPrices.push(d3.deviation(prices));
          minPrices.push(minpr);
          minTexts.push(imerominia.slice(4));
        });
        //console.log({"mean":meanPrices,"median":medianPrices,"st": stdevPrices});
        // Create a new element to hold the statistical measures
        let stats = document.createElement("div");
        stats.className = "statistics";
        //let timi_el;
        let gram = document.createElement("span");
        gram.innerText = `ελάχιστο: ${minEver}`;
        let pos;
        let minind = minPrices.indexOf(Math.min(...minPrices));

        try {
          let timi_el = kin[i].getElementsByClassName("sku-link")[0];
          if (!timi_el) {
            timi_el = kin[i].getElementsByClassName("product-link")[0];
          }
          let pr = parseFloat(
            timi_el.text
              .replace(/^[^\d,]*/, "")
              .replace(/[^\d,]*$/, "")
              .replace(".", "")
              .replace(",", ".")
          );
          pos = ((minEver - pr) / minEver) * 100;
          gram.innerText += "  (";
          pos = parseInt(pos);
          if (pos > 0) {
            gram.innerText += "+";
          }
          gram.innerText += pos.toString() + "%) @" + minTexts[minind];
          if (pos >= -10) {
            gram.style.color = "green";
          }
        } catch {
          console.log("oops");
        }
        kin[i].appendChild(gram);

        // Insert the statistical measures into the element
        const ctx = document.createElement("canvas");
        ctx.className = "grafima";
        const chart = new Chart(ctx, {
          type: "bar",
          data: {
            labels: timePeriods,
            datasets: [
              {
                label: "Μέση τιμή",
                data: meanPrices,
                borderColor: "#3e95cd",
                backgroundColor: "#3e95cd",
                type: "line",
                pointRadius: 2,
                pointHoverRadius: 3,
                fill: false,
                spanGaps: true,
                yAxisID: "y-axis-1",
              },
              {
                label: "Διάμεσος",
                data: medianPrices,
                borderColor: "#3cba9f",
                backgroundColor: "#3cba9f",
                type: "line",
                pointRadius: 2,
                pointHoverRadius: 3,
                fill: false,
                showLine: true,
                yAxisID: "y-axis-1",
              },
              {
                label: "Πάνω όριο τυπ. απόκλισης",
                data: meanPrices.map((mean, i) => mean + stdevPrices[i]),
                borderColor: "#000000",
                backgroundColor: "#000000",
                type: "line",
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                showLine: true,
                yAxisID: "y-axis-1",
              },
              {
                label: "Κάτω όριο τυπ. απόκλισης",
                data: meanPrices.map((mean, i) => mean - stdevPrices[i]),
                borderColor: "#000000",
                backgroundColor: "#000000",
                type: "line",
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                showLine: true,
                yAxisID: "y-axis-1",
              },
              {
                label: "ελάχιστη τιμή",
                data: minPrices,
                borderColor: "#FF0000",
                backgroundColor: "#FF0000",
                type: "line",
                borderDash: [2, 2],
                pointRadius: 2,
                pointHoverRadius: 3,
                fill: false,
                showLine: true,
                yAxisID: "y-axis-1",
              },
            ],
          },
          options: {
            legend: { display: false },
            scales: {
              yAxes: [
                {
                  id: "y-axis-1",
                  position: "left",
                  ticks: {
                    beginAtZero: false,
                    suggestedMin: Math.min(...minPrices),
                  },
                },
                {
                  id: "y-axis-2",
                  position: "right",
                  ticks: {
                    beginAtZero: false,
                  },
                },
              ],
            },
          },
        });
        // Add the element to the DOM
        kin[i].appendChild(ctx);
        const chartContainer = kin[i].querySelector(".grafima");
        if (pos != "undefined") {
          //percentages.push(pos);
          //lista.push(kin[i]);
          if (!lista.some((item) => item.element === kin[i])) {
            const elementCopy = kin[i].cloneNode(true);
            lista.push({ element: elementCopy, perc: pos });
          }
        }
      });
  }
  //return [kin, pososta];
}

function sortElems(lista) {
  if (!lista.length) {
    return null;
  }

  // Sort the elements based on the perc property
  lista.sort((a, b) => {
    // Compare the perc property
    if (b.perc == null) return -1;
    else if (a.perc == null) return 1;
    if (a.perc > b.perc) {
      return -1;
    } else if (a.perc < b.perc) {
      return 1;
    } else {
      return 0;
    }
  });
  return lista;
}
function change(setting) {
  if (setting == true) return false;
  else return true;
}
function addButton(h1) {
  // Create a new button element
  var button = document.createElement("button");

  // Create an img element
  var img = document.createElement("img");

  // Set the src attribute of the img element to the desired image URL
  //let delurl=chrome.runtime.getURL("./images/delete.png");
  let delurl =
    "https://www.clipartmax.com/png/middle/222-2221584_broom-clear-clean-tool-comments-clear-icon-png-blue.png";
  //img.innerHTML=`<img id="icon" src="./images/delete.png">`
  img.src = delurl;
  img.setAttribute("height", "24");
  img.setAttribute("weight", "24");

  // Append the img element to the button element
  button.appendChild(img);
  button.setAttribute("type", "button");
  // Set the onclick attribute of the button element to the desired function
  button.setAttribute(
    "title",
    "Διέγραψε όλα τα αποθηκευμένα διαγράμματα ελάχιστης τιμής!"
  );
  button.style.marginLeft = "3em";
  // Select the reference node
  //var referenceNode = h1.firstChild;
  Promise(urls)
  // Insert the button element before the reference node
  h1.appendChild(button);

  button.addEventListener("click", function () {
    lista = [];
    //console.log("διαγράφτηκαν τα διαγράμματα!");
  });
}
function addDealsButton(h1) {
  let graphsbutton = document.createElement("div");
  var button = document.createElement("button");

  // Create an img element
  var img = document.createElement("img");
  let delurl = "https://img.icons8.com/ios-filled/512/low-price-euro.png";
  //img.innerHTML=`<img id="icon" src="./images/delete.png">`
  img.src = delurl;
  img.setAttribute("height", "24");
  img.setAttribute("weight", "24");

  // Append the img element to the button element
  button.appendChild(img);
  button.setAttribute("type", "button");
  // Set the onclick attribute of the button element to the desired function
  button.setAttribute(
    "title",
    "(Beta) Τύπωσε στην κονσόλα τα καλύτερα deals από προϊόντα που είδες σήμερα !"
  );
  //graphsbutton.style.marginLeft = "20em";
  // Select the reference node
  //var referenceNode = h1.firstChild;
  graphsbutton.appendChild(button);
  // Insert the button element before the reference node
  h1.appendChild(graphsbutton);
  button.onclick = function () {
    console.log("PRODUCT DEALS ΣΗΜΕΡΑ:")
    let d=productDeals(30);
    for (let pr of d){
      console.log(pr.url,pr)
    }
    // console.log();
  };
}

function addScanButton(h1) {
  let graphsbutton = document.createElement("div");
  var button = document.createElement("button");

  // Create an img element
  var img = document.createElement("img");
  let delurl = "https://cdn.iconscout.com/icon/premium/png-32-thumb/search-document-1595247-1355010.png?f=avif";
  //img.innerHTML=`<img id="icon" src="./images/delete.png">`
  img.src = delurl;
  img.setAttribute("height", "24");
  img.setAttribute("weight", "24");

  // Append the img element to the button element
  button.appendChild(img);
  button.style.marginLeft="1em"
  button.setAttribute("type", "button");
  // Set the onclick attribute of the button element to the desired function
  button.setAttribute(
    "title",
    "(Beta) Σκάναρε όλες τις σελίδες και τύπωσε τα 50 καλύτερα deals!"
  );
  const loadingIcon = document.createElement("div");
  loadingIcon.classList.add("loading-icon");
  button.appendChild(loadingIcon);
  loadingIcon.style.display="none";

  //graphsbutton.style.marginLeft = "20em";
  // Select the reference node
  //var referenceNode = h1.firstChild;
  graphsbutton.appendChild(button);
  // Insert the button element before the reference node
  h1.appendChild(graphsbutton);
  button.onclick = async function () {
    loadingIcon.style.display="block";
    await fetchAllPagesStats().then(()=>{loadingIcon.style.display="none";
    try{cleanNdict();}catch{let tpt=""}})
    // console.log();
  };
}
function addFilterButton(h1) {
  // Create a new button element
  var button = document.createElement("button");

  // Create an img element
  var img = document.createElement("img");

  // Set the src attribute of the img element to the desired image URL
  let filterUrl =
    "https://icon-library.com/images/distance-icon/distance-icon-6.jpg";
  img.src = filterUrl;
  img.setAttribute("height", "24");
  img.setAttribute("weight", "24");

  // Append the img element to the button element
  button.appendChild(img);
  button.setAttribute("type", "button");
  // Set the onclick attribute of the button element to the desired function
  button.setAttribute(
    "title",
    "Φιλτράρισμα των διαθέσιμων προϊόντων σε κοντινό κατάστημα!"
  );
  button.style.marginLeft = "3em";
  // Select the reference node
  //var referenceNode = h1.firstChild;

  // Insert the button element before the reference node
  h1.appendChild(button);

  button.addEventListener("click", async function () {
    //for i in items array create a promise of that skuid in a url and fetch the json responses in a array
    //then for each response check if the some item has availability 0 and distance_tier equal to 2
    //if no then make the html item invisible
    //if yes then make the html item visible
    //console.log("φιλτράρισμα");
    let furls=[];
    for (let p of nodes){
      let pd = getProductDetails(p);
      if (pd == null || Object.values(pd).some((x) => x == null)) continue;
      let filterurl="https://www.skroutz.gr/s/"+pd.skuid+"/products/filters"
      furls.push(filterurl);
    }
    let resp=await fetchAllUrls(furls);
    let close=[];
    for (let r of resp){
      if (r==null) close.push(false);
      let prods=Object.values(r["products_specs"]);
      let avail=prods.some((x)=>x["availability"]==1 && x["distance_tier"]==0);
      close.push(avail);
    }
    //map close to nodes
    console.log(nodes,close);
    for (let i=0;i<close.length;i++){
      if (close[i]) nodes[i].style.display="block";
      else nodes[i].style.display="none";
    }

  });
}


function addGraphButton(h1) {
  // Create a new button element
  let graphsbutton = document.createElement("div");
  var button = document.createElement("button");

  // Create an img element
  var img = document.createElement("img");

  // Set the src attribute of the img element to the desired image URL
  //let delurl=chrome.runtime.getURL("./images/delete.png");
  let delurl =
    "https://www.iconpacks.net/icons/1/free-chart-icon-646-thumb.png";
  //img.innerHTML=`<img id="icon" src="./images/delete.png">`
  img.src = delurl;
  img.setAttribute("height", "24");
  img.setAttribute("weight", "24");

  // Append the img element to the button element
  button.appendChild(img);
  button.setAttribute("type", "button");
  // Set the onclick attribute of the button element to the desired function
  button.setAttribute("title", "Βγάλε διαγράμματα όπου βρεις!");
  //graphsbutton.style.marginLeft = "20em";
  // Select the reference node
  //var referenceNode = h1.firstChild;
  graphsbutton.appendChild(button);
  // Insert the button element before the reference node
  h1.appendChild(graphsbutton);


  // Create the div element
  let div = document.createElement("div");
  div.style.top = button.offsetTop + button.offsetHeight + "px";
  div.style.left = button.offsetLeft + "px";
  let setting = document.createElement("div");
  div.appendChild(setting);
  setting.innerHTML = `<input type="checkbox" style="-webkit-appearance: none;" id="autoloadgraphs" name="graphsload">
  <label for="autoloadgraphs"> Αυτόματη φόρτωση διαγραμμάτων</label><br>`;
  tickbox = setting.getElementsByTagName("input")[0];
  tickbox.className = "my-checkbox";
  if (tickbox) {
    tickbox.checked = settings.autoLoadGraphs;
    tickbox.onclick = () => {
      if (tickbox.checked) tickbox.style.backgroundColor = "#1c7ece";
      settings.autoLoadGraphs = change(settings.autoLoadGraphs);
      console.log("Changed", settings.autoLoadGraphs);
      localStorage.setItem("vanced-graph-settings", JSON.stringify(settings));
    };
  }
  graphsbutton.appendChild(div);

  // Create an input element
  const input = document.createElement("input");
  //input.style.right=0
  input.display = "-webkit-box";
  input.title =
    "Όρισε το όριο όπου θα γίνεται πράσινο το ποσοστό ιστορικού χαμηλού!";
  input.type = "number";
  input.height = "2em";
  input.width = "3em";
  input.min = -50;
  input.max = 100;
  input.step = 1;
  input.placeholder = "-10";

  // Append the input element to the DOM
  koumpia.appendChild(input);

  // Listen to the input event of the input element
  input.addEventListener("input", () => {
    // Update the value of settings.limit with the value of the input element
    console.log(input.value);
    settings.limit = input.value;
    localStorage.setItem("vanced-graph-settings", JSON.stringify(settings));
    for (let p of lists[0].children) {
      let pd = getProductDetails(p);
      try {
        if (p.querySelector(".grafima")) {
          let gram = Array.from(p.getElementsByTagName("span")).at(-1);
          setGreenColor(gram, pd["pososto"]);
        }
      } catch (err) {
        console.log("otan allaza xrwma sto:", pd);
      }
    }
  });

  button.addEventListener("click", async function () {
    graphsLoaded = false;
    for (let l of lists) {
      showGraphs(l.children);
    }
  });
}

function addSortButton(h1) {
  // Create a new button element
  var button = document.createElement("button");
  let sortbutton = document.createElement("div");
  // Create an img element
  var img = document.createElement("img");

  // Set the src attribute of the img element to the desired image URL
  //let delurl=chrome.runtime.getURL("./images/delete.png") --> AUTO DE DOYLEUEI
  let delurl =
    "https://cdn.iconscout.com/icon/free/png-256/sort-1772385-1508281.png";
  //img.innerHTML=`<img id="icon" src="./images/delete.png">`
  img.src = delurl;
  img.setAttribute("height", "24");
  img.setAttribute("weight", "24");

  // Append the img element to the button element
  button.appendChild(img);
  button.setAttribute("type", "button");
  // Set the onclick attribute of the button element to the desired function
  button.setAttribute(
    "title",
    "Ταξινόμησε όλα τα προϊόντα της σελίδας ανάλογα με το ποσοστό απόκλισης από το ιστορικό χαμηλό!"
  );
  button.style.marginLeft = "1em";
  // Select the reference node
  //var referenceNode = h1.firstChild;
  sortbutton.appendChild(button);
  // Insert the button element before the reference node
  h1.appendChild(sortbutton);
  let div = document.createElement("div");
  div.style.top = button.offsetTop + button.offsetHeight + "px";
  div.style.left = button.offsetLeft + "px";
  let setting = document.createElement("div");
  div.appendChild(setting);
  setting.innerHTML = `<input type="checkbox" style="-webkit-appearance: none;" id="autoSortProducts" name="graphsload">
  <label for="autoSortProducts"> Αυτόματη ταξινόμηση προϊόντων</label><br>`;
  tickbox = setting.getElementsByTagName("input")[0];
  tickbox.className = "my-checkbox";
  if (tickbox) {
    tickbox.checked = settings.autoSortProducts;
    tickbox.onclick = () => {
      if (tickbox.checked) tickbox.style.backgroundColor = "#1c7ece";
      settings.autoSortProducts = change(settings.autoSortProducts);
      console.log("Changed", settings.autoSortProducts);
      localStorage.setItem("vanced-graph-settings", JSON.stringify(settings));
    };
  }
  sortbutton.appendChild(div);

  button.addEventListener("click", () => {
    sortPage();
  });
}
function sortPage() {
  for (skuList of lists) {
    // if (!graphsLoaded) {
    //   await getNodesGraphs(skuList.children);
    // }
    let lista = [];
    Array.from(skuList.children)
      .filter((x) => !isSpons(x))
      .forEach((x) => {
        let pd = getProductDetails(x);
        let perc;
        try {
          perc = parseFloat(n[pd.skuid]["pososto"]);
        } catch (err) {
          //console.log("sto pososto" + err);
          perc = null;
        }
        lista.push({
          elem: x,
          perc: perc,
        });
      });
    lista.forEach((obj) => skuList.removeChild(obj.elem));
    lista = sortElems(lista);


    // Add the sorted li elements to the sku-list element
    lista.forEach((obj) => skuList.appendChild(obj.elem));
    for (let el of skuList.children) {
      try {
        if (el.querySelector(".gram") || p.className.includes("-more-"))
          continue;
        let a = getProductDetails(el);
        createGraph(n[a.skuid], el, a.skuid, a.title, a.price);
      } catch (error) {
        //console.log(error);
      }
    }
  }
}
function changeElement(product, grafima) {
  // Create the popup element
  let popup = document.createElement("div");
  popup.className = "chart-popup";

  //product.parentElement.insert(popup);
  let par = product.parentElement;
  par.parentElement.insertBefore(popup, par);

  product.addEventListener("mouseenter", function () {
    popup.style.display = "block";
  });

  product.addEventListener("mouseleave", function () {
    popup.style.display = "none";
  });
  return popup;
}
function findLists() {
  let possibles = [];
  possibles.push(...document.body.getElementsByTagName("ul"));
  possibles.push(...document.body.getElementsByTagName("ol"));
  let contposs = null;
  contposs = possibles.filter((x) => {
    str = x.className;
    return (
      !str.includes("filter") &&
      !str.includes("shadow") &&
      !str.includes("users-reviews") &&
      !str.includes("-nav-") &&
      !str.includes("-actions") &&
      str != ""
    );
  });
  //AN EIMAI STIN ARXIKH PREPEI NA VGALW TO INCLUDES "LIST" str.includes("list")
  if (contposs.length > 1) {
    contposs = contposs.filter((x) =>
      Array.from(x.children).some((x) =>
        Array.from(x.getElementsByTagName("a")).some((x) =>
          x.href.includes("/s/")
        )
      )
    );
  }
  if (contposs.length > 1 && nowurl == "https://www.skroutz.gr/") {
    let tags = contposs.map((x) => x.tagName);
    if (tags.includes("UL") && tags.includes("OL")) {
      contposs = contposs.filter((x) => x.tagName == "UL");
    }
  }
  if (contposs.length==1) return contposs
  return contposs.filter(x=>!x.querySelector(".gram"))

}
function getProductDetails(p) {
  let b = p.getElementsByTagName("a");
  let url = "";
  let title, price, skuid;
  if (b.length == 0) return null;
  s = [];
  for (let x of b) {
    if (x.href.includes("/s/")) {
      s.push(x);
    }
  }
  try {
    url = s.at(-1).href.replace(/\.html.*/, "/price_graph.json");
  } catch (err) {
    //console.log("sto link" + err);
    return null;
  }
  let t = s.map((x) => x.textContent);
  let l = t.map((x) => x.length);
  let ind = l.indexOf(Math.max(...l));
  if (!t[ind].includes("€")) {
    title = t[ind];
  } else {
    title = decodeURI(
      url.replace("/price_graph.json", "").replace(/^.+\/s\/\d+\//, "")
    ).replaceAll("-", " ");
  }
  let pricetext = t.filter((x) => x.includes("€")).at(-1);
  if (!pricetext) price = null;
  else
    price = parseFloat(
      pricetext
        .match(/[\d,\.]+/)[0]
        .replace(".", "")
        .replace(",", ".")
    );
  try {
    skuid = parseInt(url.match(/\/s\/(\d+)\//)[1]);
  } catch (err) {
    //console.log(err);
    skuid = null;
  }
  return { price: price, title: title, url: url, skuid: skuid };
}
function hasRecentGraph(skuid, price=null){
  if (n.hasOwnProperty(skuid.toString()) &&
      n[skuid].hasOwnProperty("day") &&
      n[skuid]["day"] == day &&
      n[skuid]["price"]==price &&
      Object.values(n[skuid]).every((x) => x != null)) return true
  else return false;
}
async function getNodesGraphs(nodes) {
  const promises = [];
  for (let p of nodes) {
    if (p.querySelector(".gram")) continue;
    let pd = getProductDetails(p);
    if (pd == null || Object.values(pd).some((x) => x == null)) continue;
    if (hasRecentGraph(pd.skuid, pd.price)
    ) {
      //De xreiazetai na kanei kati an exei idi grafima
      //return n[pd.skuid]
      //createGraph(n[pd.skuid], p, pd.skuid, pd.title, pd.price); //thelei allagi
    } else {
      promises.push(createGraphData(pd));
    }
  }

  const results = await Promise.all(promises);
  //let filtered = results.filter((x) => !n.hasOwnProperty(x.skuid.toString()));
  console.log(Object.values(n).length);
  return results;
  
  
}
function showGraphs(nodes) {
  for (let p of nodes) {
    try {
      if (!p.querySelector(".gram")) {
        let pd = getProductDetails(p);
        if (pd != null && !p.className.includes("-more-"))
          createGraph(n[pd.skuid], p, pd.skuid, pd.title, pd.price);
      }
    } catch (err) {
      //console.log("error otan piga na tipwsw diagramma" + err);
    }
  }
  graphsLoaded = true;
}
function getNextPageUrl(url) {
  //url=url.replace(/.html/)
  let next = "";
  c = url.match(/page\=(\d+)/);
  if (c) {
    let page = parseInt(c[1]);
    //console.log(`I am at page ${page}`);
    page++;
    //console.log(`and I will fetch page ${page}`);
    next = url.replace(/\=\d+/, "=" + page.toString());
  } else {
    next = url.replace(".html", ".html?page=2");
  }
  return next.replace(".html", ".json");
}
async function fetchNextPage() {
  let nextp = nextPage();
  if (!nextp.includes("/.json")) {
    await getPageGraphs(nextp);
  }
}

function createGraphData(a) {
  
  let url = a.url;
  let current_price = a.price;

  let link = url;
  var ret;
  let minEver;
  return new Promise((resolve, reject) => {
    // Load the data for the product
    fetch(link)
      .then((response) => response.json())
      .then((data) => {
        // Extract the data for each time period
        let timePeriods;
        try {
          timePeriods = Object.keys(data["min_price"]["graphData"]);
        } catch {
          resolve(null);
        }
        timePeriods.reverse();
        const meanPrices = [];
        const medianPrices = [];
        const stdevPrices = [];
        const minPrices = [];
        const minStamps = [];
        timePeriods.forEach((period) => {
          const values = data["min_price"]["graphData"][period]["values"];
          const prices = values.map((v) => v["value"]).filter((p) => p !== 0.0);
              
          let minpr=null;
          let minprelements;
          if (prices.length == 0) {
            minpr = null;
            meanPrices.push(null);
            medianPrices.push(null);
            stdevPrices.push(null);
            minPrices.push(minpr);
            minStamps.push(null);
          } else {
            if (period=="1_months"){
          //VGAZEI OLES TIS PROSFATES TIMES POU EINAI ISES ME TIN TWRINI TIMI
              let clonepr=structuredClone(values).filter(v=>v["value"]!=0)
              while (clonepr.at(-1) && clonepr.at(-1)["value"] == current_price) clonepr.pop();
              
              minpr=Math.min(...clonepr.map(x=>x["value"]))
              if (clonepr.length==0){
                minpr=current_price
                clonepr=values;
              }
              minprelements = clonepr
              .filter((x) => x.value == minpr)
              .map((x) => x.timestamp);
            }
            else{ minpr = Math.min(...prices);
            minprelements = values
              .filter((x) => x.value == minpr)
              .map((x) => x.timestamp);}
            let tm = null;
            if (minprelements.length > 0) {
              tm = minprelements.at(-1);
            }
            
            let mean = parseFloat(d3.mean(prices).toFixed(2));
            let median = parseFloat(d3.median(prices).toFixed(2));
            let std;
            try {
              std = parseFloat(d3.deviation(prices).toFixed(2));
            } catch {
              std = null;
            }
            meanPrices.push(mean);
            medianPrices.push(median);
            stdevPrices.push(std);
            minPrices.push(minpr);
            minStamps.push(tm);
          }
        });

        minEver = Math.min(...minPrices.filter((x) => x != null));
        let pos=parseFloat(getPos(minEver, current_price))
        let minind = minPrices.indexOf(minEver);
        let ltimestamp;
        try {
          ltimestamp = minStamps[minind];
        } catch {
          ltimestamp = 1;
        }
        let graphdata = {
          mean: meanPrices,
          median: medianPrices,
          std: stdevPrices,
          min: minPrices,
        };
        ret = {
          graphdata: graphdata,
          title: a.title,
          minpr: minEver,
          lastTimestamp: ltimestamp,
          day:day,
          price:current_price,
          pososto:pos,
          id:a.skuid
        };
        //console.log(ret);
        n[a.skuid] = ret;
        resolve(ret);
      })
      .catch((error) => {
        // Reject the Promise with the error if there is one
        reject(error);
      });
  });
}

async function fetchAllPagesStats(number=50){
 let pages;
 let te=document.getElementsByClassName("react-component paginator cf")
 if (te.length>0){
  let lp=Array.from(te[0].children).at(-2)
  let m=lp.lastChild.href.match(/page\=(\d+)/)
 if (m){
  pages=parseInt(m[1])
 }
 else{
  return null;
 }
 }
 else return null;
 

let url_template=nextPage()
let urls=[]
for (let i=1; i<=pages; i++){
urls.push(url_template.replace(/page\=\d+/,"page="+String(i)))
}
let promises=[];
for (let u of urls){
  promises.push(getSkus(u))
}
let skus=[];
let pagesskus=await Promise.all(promises);
for (let p of pagesskus){
  skus.push(...p)
}
let b=location.hostname;
let skus_nograph = skus.filter((x) => !hasRecentGraph(x.skuid, x.price));
let skus_graph=skus.filter((x) => hasRecentGraph(x.skuid, x.price));
urls=skus_nograph.map((x) => x.url);
promises=[];
let graphsdata = await fetchAllUrls(urls);
let lista=skus_graph.map(x=>{let ret=n[x.skuid];ret["url"]=b+x.url.replace("/price_graph.json",".html");return ret;})
for (let i = 0; i < graphsdata.length; i++) {
  if (graphsdata[i] != {}) {let ret=createGraphDataFromJSON(graphsdata[i], skus_nograph[i]);
    if (ret==null ) continue;
    ret["url"]=b+skus_nograph[i].url.replace("/price_graph.json",".html");
    lista.push(ret)};
}
console.clear();
console.log(lista.length);
lista=lista.filter(x=>x!=null).filter((x) => x.day == day)
.filter((x) => x.title != null);
skus.filter(x=>n.hasOwnProperty(x.skuid.toString()))
lista.sort((a, b) => {
  // Compare the perc property
  if (b.pososto == null) return -1;
  else if (a.pososto == null) return 1;
  if (a.pososto > b.pososto) {
    return -1;
  } else if (a.pososto < b.pososto) {
    return 1;
  } else {
    return 0;
  }
});
//TYPWSE
console.log("TOP 50 DEALS ΑΠΟ ΠΡΟΙΟΝΤΑ ΟΛΩΝ ΤΩΝ ΣΕΛΙΔΩΝ:")
let printlista = structuredClone(lista.slice(0, number));

printlista.forEach((x) => {
  delete x.graphdata;
  delete x.day;
  if (!x.hasOwnProperty("price")) x.price = ((1 - x.pososto / 100) * x.minpr).toFixed(2);
  x.lastTimeLow = new Date(x.lastTimestamp * 1000).toDateString().slice(4);
  delete x.lastTimestamp;
  delete x.id;
});
for(let item of printlista){
  console.log(item.url,item)
}

}

function setGreenColor(gram, pos) {
  gram.style.color = "black";
  if (pos != null && pos >= settings.limit) {
    gram.style.color = "green";
  }
}

function createGraph(obj, product, skuid, title, pr) {
  if (obj == null) return null;
  let minEver;
  let graphdata = obj.graphdata;
  let meanPrices = graphdata.mean;
  let stdevPrices = graphdata.std;
  let medianPrices = graphdata.median;
  let minPrices = graphdata.min;
  let minTimestamp = obj.lastTimestamp;
  minEver = obj["minpr"];
  obj["day"] = day;
  obj["skuid"] = skuid;

  if (typeof (minEver == "undefined") || minEver == 0) {
    minEver = Math.min(...minPrices.filter((x) => x != null));
  }
  let gram = document.createElement("span");
  gram.className = "gram";
  let pos=obj["pososto"]
  if (minEver != 0) {
    gram.innerText = `ελάχιστο: ${minEver}`;
    //let pos = null;
    if (pr != null) {
      //yparxei to price kai dn einai null
      gram.innerText += "  (";
      if (pos > 0) {
        gram.innerText += "+";
      }
      gram.innerText +=
        Math.round(pos).toString() +
        "%) @" +
        new Date(minTimestamp * 1000).toDateString().slice(4);
    }
    pos = parseFloat(pos);
    //obj["pososto"] = pos;
    setGreenColor(gram, pos);
    product.appendChild(gram);
  }
  // Insert the statistical measures into the element
  let highstd = meanPrices
    .map((mean, i) => mean + stdevPrices[i])
    .map((element) => {
      if (element === 0) {
        return null;
      }
      return element;
    });
  let lowstd = meanPrices
    .map((mean, i) => mean - stdevPrices[i])
    .map((element) => {
      if (element === 0) {
        return null;
      }
      return element;
    });
  const ctx = document.createElement("canvas");
  ctx.className = "grafima";
  // if (product.clientHeight < 300 || product.clientWidth < 200) {
  if (typeof pop == "undefined") {
    pop = document.createElement("div");
    pop.className = "chart-popup";
    dragElement(pop);
    pop.setAttribute("draggable", "true");
    let par = product.parentElement;
    par.parentElement.insertBefore(pop, par);
    let test = document.createElement("span");
    test.innerText = "";
    pop.appendChild(test);
    let closeicon = document.createElement("img");
    let closeiconurl =
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrM48tgSdjAHG3UrvzCzWdTKAdu3DqhOdUKg&usqp=CAU";
    closeicon.src = closeiconurl;
    closeicon.setAttribute("type", "button");
    closeicon.className = "closing-icon";
    closeicon.onmouseover = function () {
      pop.style.display = "none";
    };
    pop.appendChild(closeicon);
  }
  ctx.style.display = "none";
  pop.appendChild(ctx);
  product.addEventListener("mouseenter", function () {
    if (settings.autoLoadGraphs){
    if (lastel) lastel.style.display = "none";
    pop.style.display = "block";
    ctx.style.display = "block";
    pop.querySelector("span").innerText = title;
    lastel = ctx;
}});

  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: timePeriods,
      datasets: [
        {
          label: "Μέση τιμή",
          data: meanPrices,
          borderColor: "#3e95cd",
          backgroundColor: "#3e95cd",
          type: "line",
          pointRadius: 2,
          pointHoverRadius: 3,
          fill: false,
          spanGaps: true,
          yAxisID: "y-axis-1",
        },
        {
          label: "Διάμεσος",
          data: medianPrices,
          borderColor: "#3cba9f",
          backgroundColor: "#3cba9f",
          type: "line",
          pointRadius: 2,
          pointHoverRadius: 3,
          fill: false,
          showLine: true,
          yAxisID: "y-axis-1",
        },
        {
          label: "Πάνω όριο τυπ. απόκλισης",
          data: highstd,
          borderColor: "#000000",
          backgroundColor: "#000000",
          type: "line",
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          showLine: true,
          yAxisID: "y-axis-1",
        },
        {
          label: "Κάτω όριο τυπ. απόκλισης",
          data: lowstd,
          borderColor: "#000000",
          backgroundColor: "#000000",
          type: "line",
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          showLine: true,
          yAxisID: "y-axis-1",
        },
        {
          label: "ελάχιστη τιμή",
          data: minPrices,
          borderColor: "#FF0000",
          backgroundColor: "#FF0000",
          type: "line",
          borderDash: [2, 2],
          pointRadius: 2,
          pointHoverRadius: 3,
          fill: false,
          showLine: true,
          yAxisID: "y-axis-1",
        },
      ],
    },
    options: {
      legend: { display: false },
      scales: {
        yAxes: [
          {
            id: "y-axis-1",
            position: "left",
            ticks: {
              beginAtZero: false,
              suggestedMin: minEver,
            },
          },
        ],
      },
    },
  });
  // Add the element to the DOM

  //return ctx;
  //obj["chart"] = chart;
  //const chartContainer = product.querySelector(".grafima");
  return obj;
}

function productDeals(number=50) {
  let today = structuredClone(Object.values(n))
    .filter((x) => x.day == day)
    .filter((x) => x.title != null);
  today.sort((a, b) => {
    // Compare the perc property
    if (b.pososto == null) return -1;
    else if (a.pososto == null) return 1;((a, b) => {
      // Compare the perc property
      if (b.pososto == null) return -1;
      else if (a.pososto == null) return 1;
      if (a.pososto > b.pososto) {
        return -1;
      } else if (a.pososto < b.pososto) {
        return 1;
      } else {
        return 0;
      }
    });
    if (a.pososto > b.pososto) {  
      return -1;
    } else if (a.pososto < b.pososto) {
      return 1;
    } else {
      return 0;
    }
  });
  today = today.slice(0, number);
  today.forEach((x) => {
    delete x.graphdata;
    delete x.day;
    if (!x.hasOwnProperty("price")) x.price = ((1 - x.pososto / 100) * x.minpr).toFixed(2);
    x.lastTimeLow = new Date(x.lastTimestamp * 1000).toDateString().slice(4);
    x.url =
      "https://www.skroutz.gr/s/" +
      x.id +
      "/" +
      x.title.replaceAll(/[\s\/\(\)\"\.]+/gm,"-").replace(/\-$/,"") +
      ".html";
    delete x.lastTimestamp;
  });
  return today;
}
