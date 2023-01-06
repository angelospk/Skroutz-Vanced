// Create a style element
// const style = document.createElement("style");

// // Add the CSS rules as the text content of the style element
// style.innerHTML = `
// input[type="checkbox"]:checked {
//   background-image: url('https://icon-library.com/images/small-check-mark-icon/small-check-mark-icon-24.jpg'); /* path to the tick image */
//   background-size: contain; /* resize the image to fit inside the checkbox */
// }
// `;

let day = new Date().getDate();
//let settings=JSON.parse(localStorage.getItem("vanced-graph-settings"));

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
  // Step 1: Select all elements to be removed
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
// if (
//   Object.values(n)
//     .map((x) => x.pr)
//     .some((x) => Object.values(x).length == 0)
// ) {
//   n = {};
//   localStorage.setItem("graphsElements", JSON.stringify(n));
// }
var h1 = document.getElementsByClassName("page-title")[0];
var koumpia = document.createElement("div");
koumpia.style.marginLeft = "10em";
//koumpia.style.maxWidth="25%"
koumpia.style.display = "flex";
koumpia.style.alignItems = "flex-start";
h1.appendChild(koumpia);
let lists;
let graphsLoaded = false;
if (typeof button == "undefined") {
  addGraphButton(koumpia);
  addSortButton(koumpia);
  computeSortedGraphs().then(() => {
    console.log("fortwsa");
  });
  //addButton(h1);
  //addSortButton(h1);
  //console.log("evala koumpi gia grafima kai gia sorting");
}

// getNodesGraphs(document.body.getElementsByTagName("li")).then(
//   console.log("run nodes func")
// );
async function computeSortedGraphs() {
  graphsLoaded = false;
  lists = findLists();
  for (let l of lists) {
    if (settings.autoLoadGraphs) await getNodesGraphs(l.children);
    if (settings.autoSortProducts) await sortPage();
  }
  //fetchNextPage()
  await fetchNextPage();
  localStorage.setItem("graphs", JSON.stringify(n));
}
const targetNode = lists[0];
let nowurl = document.baseURI;
const observer = new MutationObserver(async (mutations) => {
  // Iterate through the mutations and run your script for each mutation
  //console.log("updated");
  if (mutations.some((x) => x.target.baseURI != nowurl)) {
    //console.log("namaste");
    nowurl = document.baseURI;
    console.log("nea selida");
    blurSp();
    await computeSortedGraphs();
  }
  if (mutations.length > 10) {
    //console.log(mutations);
    //await getNodesGraphs(document.body.getElementsByTagName("li"));
  }
  // mutations.forEach((mutation) => {
  //   // Run your script
  //   //console.log(mutation)
  //   // console.log(mutation);
  //   //getGraphs();
  // });
});

// Configure the observer to watch for childList and attribute changes
const config = { childList: true, attributes: true, subtree: true };

// Start observing the target node for configured mutations
observer.observe(document, config);

// let elementStyle;
// let lista = [];
// getGraphs();
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

function getGraphs() {
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
  // Remove the existing li elements from the sku-list element
  /*
  let skuList = getList();
  while (skuList.firstChild) {
    skuList.removeChild(skuList.firstChild);
  }

  // Add the sorted li elements to the sku-list element
  lista.forEach(obj => skuList.appendChild(obj.element));
  
  
  //percentages = lista.map(li => percentages[lista.indexOf(li)]);
  // Update the DOM with the sorted elements
  let skuList =getList();
  while (skuList.firstChild) {
    skuList.removeChild(skuList.firstChild);
  }

  // Add the sorted li elements to the sku-list element
  lista.forEach(li => skuList.appendChild(li));
  //sorted=true;
  //getList().innerHTML = kin.map(li => li.outerHTML).join('');
  //return [skuList.children,percentages];
  */
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
  img.setAttribute("height", "32");
  img.setAttribute("weight", "32");

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

  // Insert the button element before the reference node
  h1.appendChild(button);

  button.addEventListener("click", function () {
    lista = [];
    //console.log("διαγράφτηκαν τα διαγράμματα!");
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
  img.setAttribute("height", "32");
  img.setAttribute("weight", "32");

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

  // // Create the tickbox element
  // let tickbox = document.createElement("input");
  // tickbox.setAttribute("type", "checkbox");
  // tickbox.setAttribute("checked", settings.autoLoadGraphs); // Set the checked attribute to the value of the variable in the script

  // // Create the text element
  // let text = document.createElement("p");
  // text.textContent = "auto load graphs";

  // Create the div element
  let div = document.createElement("div");
  div.style.top = button.offsetTop + button.offsetHeight + "px";
  div.style.left = button.offsetLeft + "px";
  let setting = document.createElement("div");
  div.appendChild(setting);
  setting.innerHTML = `<input type="checkbox" style="-webkit-appearance: none;" id="autoloadgraphs" name="graphsload">
  <label for="autoloadgraphs"> Αυτόματη φόρτωση διαγραμμάτων</label><br>`;
  tickbox = setting.getElementsByTagName("input")[0];
  if (tickbox) {
    tickbox.checked = settings.autoLoadGraphs;
    tickbox.onclick = () => {
      settings.autoLoadGraphs = change(settings.autoLoadGraphs);
      console.log("Changed", settings.autoLoadGraphs);
      localStorage.setItem("vanced-graph-settings", JSON.stringify(settings));
    };
  }
  graphsbutton.appendChild(div);

  // Create an input element
const input = document.createElement("input");
input.type = "number";
input.min = -50;
input.max = 100;
input.step=1;
input.placeholder="-10"

// Append the input element to the DOM
div.appendChild(input);

// Listen to the input event of the input element
input.addEventListener("input", () => {
  // Update the value of settings.limit with the value of the input element
  console.log(input.value);
  settings.limit = input.value;
  localStorage.setItem("vanced-graph-settings", JSON.stringify(settings));
  for (let p of lists[0].children){
    let pd=getProductDetails(p);
    try{if (p.querySelector(".grafima")){
      let gram=Array.from(p.getElementsByTagName("span")).at(-1)
      setGreenColor(gram, pd["pososto"])
    }}
    catch(err){ console.log("otan allaza xrwma sto:",pd);

    }
  }
});

  // Attach the mouseenter and mouseleave event listeners to the button element
  // h1.addEventListener("mouseenter", function () {
  //   div.style.display = "block";
  // });
  // h1.addEventListener("mouseleave", function () {
  //   div.style.display = "none";
  // });

  button.addEventListener("click", async function () {
    graphsLoaded = false;
    for (let l of lists) {
      showGraphs(l.children);
    }
    // for (let n of nodes){
    //   let d=n.getElementsByTagName("span");
    //   //pairnw to pososto se noumero
    //   let pos=parseInt(d[d.length-1].textContent.replace("%)","").replace(/.*\(/,""));
    //   if (pos != "undefined") {
    //     //percentages.push(pos);
    //     //lista.push(kin[i]);
    //     if (!lista.some((item) => item.element === n)) {
    //       const elementCopy = n.cloneNode(true);
    //       lista.push({ element: elementCopy, perc: pos });
    //     }
    //   }
    // }
    //console.log("διαγράφτηκαν τα διαγράμματα!");
  });
}

function addSortButton(h1) {
  // Create a new button element
  var button = document.createElement("button");
  let sortbutton = document.createElement("div");
  // Create an img element
  var img = document.createElement("img");

  // Set the src attribute of the img element to the desired image URL
  //let delurl=chrome.runtime.getURL("./images/delete.png");
  let delurl =
    "https://cdn.iconscout.com/icon/free/png-256/sort-1772385-1508281.png";
  //img.innerHTML=`<img id="icon" src="./images/delete.png">`
  img.src = delurl;
  img.setAttribute("height", "32");
  img.setAttribute("weight", "32");

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
  if (tickbox) {
    tickbox.checked = settings.autoSortProducts;
    tickbox.onclick = () => {
      settings.autoSortProducts = change(settings.autoSortProducts);
      console.log("Changed", settings.autoSortProducts);
      localStorage.setItem("vanced-graph-settings", JSON.stringify(settings));
    };
  }
  sortbutton.appendChild(div);

  button.addEventListener("click", async () => {
    await sortPage();
  });
}
async function sortPage() {
  // TODO allakse to lists[0] sti megaliteri lista
  let skuList = lists[0];
  if (!graphsLoaded) {
    await getNodesGraphs(skuList.children);
  }
  let lista = [];
  Array.from(skuList.children)
    .filter((x) => !isSpons(x))
    .forEach((x) => {
      let pd = getProductDetails(x);
      let perc;
      try {
        perc = parseFloat(n[pd.skuid]["pososto"]);
      } catch (err) {
        console.log("sto pososto" + err);
        perc = null;
      }
      lista.push({
        elem: x,
        perc: perc,
      });
    });
  //let nulls=lista.filter(x=>x["perc"]==null).map(x=>x.elem)
  //lista=lista.filter(x=>x["perc"]!=null)
  lista.forEach((obj) => skuList.removeChild(obj.elem));
  lista = sortElems(lista);

  // while (skuList.firstChild) {
  //   if (!isSpons(skuList.firstChild)) skuList.removeChild(skuList.firstChild);
  // }

  // Add the sorted li elements to the sku-list element
  lista.forEach((obj) => skuList.appendChild(obj.elem));
  for (let el of skuList.children) {
    try {
      if (el.querySelector(".grafima")) continue;
      let a = getProductDetails(el);
      createGraph(n[a.skuid], el, a.skuid, a.title, a.price);
    } catch (error) {
      console.log(error);
    }
  }
}
function changeElement(product) {
  //product.appendChild(graph);
  product.style.zIndex = "auto";
  // product.style.width="243px"
  // product.style.height="auto";

  let height = product.clientHeight;
  console.log(height);
  if (height <= 300) {
    product.addEventListener("mouseenter", function () {
      this.style.width = "150%";
      this.style.height = "auto";
      product.style.flexDirection = "column";
      this.style.position = "static";
      this.style.maxHeight = "420px";
      this.style.zIndex = "10";
      this.style.overflowX = "scroll";
      this.style.overflowY = "hidden";
      //this.style.pointerEvents = 'none';
    });

    product.addEventListener("mouseleave", function () {
      this.style.width = "100%";
      this.style.height = "auto";
      //this.style.overflow = 'hidden';
      this.style.overflowX = "hidden";
      this.style.position = "static";
      this.style.zIndex = "auto";
      //this.parentElement.style.pointerEvents = 'auto';
    });
  }
}
function findLists() {
  let possibles = [];
  possibles.push(...document.body.getElementsByTagName("ul"));
  possibles.push(...document.body.getElementsByTagName("ol"));
  let contposs = null;
  contposs = possibles.filter((x) => {
    str = x.className;
    return (
      str.includes("list") && !str.includes("filter") && !str.includes("shadow")
    );
  });
  //AN EIMAI STIN ARXIKH PREPEI NA VGALW TO INCLUDES "LIST"
  if (contposs.length > 1) {
    contposs = contposs.filter((x) =>
      Array.from(x.children).some((x) =>
        Array.from(x.getElementsByTagName("a")).some((x) =>
          x.href.includes("/s/")
        )
      )
    );
  }

  return contposs;
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
      //break;
      //return url;}
    }
  }
  try {
    url = s.at(-1).href.replace(/\.html.*/, "/price_graph.json");
  } catch (err) {
    console.log("sto link" + err);
    return null;
  }
  let t = s.map((x) => x.textContent);
  let l = t.map((x) => x.length);
  let ind = l.indexOf(Math.max(...l));
  if (!t[ind].includes("€")) {
    title = t[ind];
  } else title = null;
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
    console.log(err);
    skuid = null;
  }
  return { price: price, title: title, url: url, skuid: skuid };
}

async function getNodesGraphs(nodes) {
  const promises = [];
  for (let p of nodes) {
    if (p.querySelector("canvas")) continue;
    let pd = getProductDetails(p);
    if (pd == null || Object.values(pd).some((x) => x == null)) continue;
    if (
      n.hasOwnProperty(pd.skuid.toString()) &&
      n[pd.skuid].hasOwnProperty("day") &&
      n[pd.skuid]["day"] == day &&
      Object.values(n[pd.skuid]).every((x) => x != null)
    ) {
      //return n[pd.skuid]
      //createGraph(n[pd.skuid], p, pd.skuid, pd.title, pd.price); //thelei allagi
    } else {
      promises.push(createGraphData(pd));
    }
  }

  const results = await Promise.all(promises);
  //let filtered = results.filter((x) => !n.hasOwnProperty(x.skuid.toString()));
  showGraphs(nodes);
  console.log(Object.values(n).length);
}
function showGraphs(nodes) {
  for (let p of nodes) {
    try {
      if (!p.querySelector(".grafima")) {
        let pd = getProductDetails(p);
        if (pd != null)
          createGraph(n[pd.skuid], p, pd.skuid, pd.title, pd.price);
      }
    } catch (err) {
      console.log("error otan piga na tipwsw diagramma" + err);
    }
  }
  graphsLoaded = true;
}
async function fetchData(url){
let res = await fetch (url);
let data=await res.json();
return data;
}
async function fetchAllUrls(urls){
  let promises=[];
  for (let u of urls){
    //fetch data for every url, put it it in the promises list
    promises.push();
  }
  const results = await Promise.all(promises);
  return results;
}
async function getSkus(url){
  //let url; //vale to url tis selidas
  url.replace(".html",".json")
  data=await fetchData(url)
  let skus=data.skus;
  let ret=[];
  for (let s of skus){
    //AUTO THELEI ALLAGI
    ret.push({price: s.price, title:s.title, url:s.url, skuid:s.sku_id})
  }

}
async function getPageGraphs(){
  let skus=await getSkus(document.baseURI)
  let urls=skus.map(x=>x.url)
  let graphsdata=await fetchAllUrls(urls);
  //graphsdata.filter(x=>x!={})
  for (let i=0; i<graphsdata.length; i++){
    if (graphsdata[i]!={}) createGraphData(graphsdata[i],skus[i])
  }

}
function getNextPageUrl(url) {
  //url=url.replace(/.html/)
  let next = "";
  c = url.match(/page\=(\d+)/);
  if (c) {
    let page = parseInt(c[1]);
    console.log(`I am at page ${page}`);
    page++;
    console.log(`and I will fetch page ${page}`);
    next = url.replace(/\=\d+/, "=" + page.toString());
  } else {
    next = url.replace(".html", ".html?page=2");
  }
  return next.replace(".html", ".json");
}
async function fetchNextPage() {
  var skus = [];
  pageUrl = getNextPageUrl(document.baseURI);
  if (pageUrl == "") return false;
  console.log(pageUrl);
  let res = await fetch(pageUrl);
  let data = await res.json();

  // Check if there are skus items in the data
  if (data.skus && data.skus.length > 0) {
    // Add the skus items to the array
    skus.push(...data.skus);
  }
  console.log(skus[0]);
  let promises = [];
  let nea = [];
  for (let s of skus) {
    let u =
      "https://www.skroutz.gr" +
      s.sku_url.replace(".html", "/price_graph.json");
    let a = {
      price: parseFloat(
        s.price
          .match(/[\d,\.]+/)[0]
          .replace(".", "")
          .replace(",", ".")
      ),
      title: s.name,
      url: u,
      skuid: s.id,
    };
    nea.push(a);
    //console.log(a);
    //
  }
  nea = nea.filter((x) => !n.hasOwnProperty(String(x.skuid)));
  console.log(nea);
  for (let item of nea) {
    promises.push(createGraphData(item));
  }
  const results = await Promise.all(promises);
}

function createGraphData(data, a) {
  // if (product.getElementsByTagName("canvas").length) {
  //   return null;
  // }
  //if (isSpons(product)) continue;
  //let url = a.url;
  let current_price = a.price;

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
          if (period == "1_months") {
            values.pop();
          }
          const prices = values.map((v) => v["value"]).filter((p) => p !== 0.0);
          //VGAZEI OLES TIS PROSFATES TIMES POU EINAI ISES ME TIN TWRINI TIMI
          if (period == "1_months") {
            for (let j = 1; j < prices.length; j++) {
              if (prices.at(-j) == current_price) prices.pop();
              else break;
            }
          }
          // if (period!="all"){
          //  prices.slice()
          // }  let mtest=url.match(/\/s\/\d+\//);
          let minpr;
          if (prices.length == 0) {
            minpr = null;
            meanPrices.push(null);
            medianPrices.push(null);
            stdevPrices.push(null);
            minPrices.push(minpr);
            minStamps.push(null);
          } else {
            minpr = Math.min(...prices);
            let minprelements = values
              .filter((x) => x.value == minpr)
              .map((x) => x.timestamp);
            let tm = null;
            if (minprelements.length > 0) {
              tm = minprelements.at(-1);
            }
            //const imerominia=new Date(minprelements.at(-1).timestamp*1000).toDateString();
            //const txt=`${minprelements.length} φορές. Τελευταία: ${imerominia}`
            //console.log(prices);
            let mean = parseFloat(d3.mean(prices).toFixed(2));
            let median = parseFloat(d3.median(prices).toFixed(2))
            let std;
            try{std = parseFloat(d3.deviation(prices).toFixed(2))}
            catch{std=null}
            //console.log(mean, median, std)
            meanPrices.push(mean);
            medianPrices.push(median);
            stdevPrices.push(std);
            // meanPrices.push(d3.round(, 2));
            // medianPrices.push(d3.round(, 2));
            // stdevPrices.push(d3.round(, 2));
            minPrices.push(minpr);
            minStamps.push(tm);
          }
        });
        //console.log({"mean":meanPrices,"median":medianPrices,"st": stdevPrices});
        // Create a new element to hold the statistical measures

        //let timi_el;
        minEver = Math.min(...minPrices.filter((x) => x != null));
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
        };
        //console.log(ret);
        n[a.skuid] = ret;
        return true;
      //   resolve(ret);
      // })
      /*.catch((error) => {
        // Reject the Promise with the error if there is one
        reject(error);
      });
  });*/
}
let timePeriods = ["all", "6_months", "3_months", "1_months"];
function setGreenColor(gram, pos){
  gram.style.color="black";
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
  obj["title"] = title;

  if (typeof (minEver == "undefined") || minEver == 0) {
    minEver = Math.min(...minPrices.filter((x) => x != null));
  }
  let gram = document.createElement("span");
  if (minEver != 0) {
    gram.innerText = `ελάχιστο: ${minEver}`;
    let pos = null;
    if (pr != null) {
      //yparxei to price kai dn einai null
      pos = (((minEver - pr) / minEver) * 100).toFixed(2);
      gram.innerText += "  (";
      if (pos > 0) {
        gram.innerText += "+";
      }
      gram.innerText +=
        Math.round(pos).toString() +
        "%) @" +
        new Date(minTimestamp * 1000).toDateString().slice(4);
    }
    // gram.innerText = spantext;
    pos = parseFloat(pos);
    obj["pososto"] = pos;
   setGreenColor(gram, pos);
    product.appendChild(gram);
  }
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
        ],
      },
    },
  });
  // Add the element to the DOM
  product.appendChild(ctx);

  //return ctx;
  //obj["chart"] = chart;
  //const chartContainer = product.querySelector(".grafima");
  return obj;
}
// if (pos != "undefined") {
//   //percentages.push(pos);
//   //lista.push(product);
//   if (!lista.some((item) => item.element === product)) {
//     const elementCopy = product.cloneNode(true);
//     lista.push({ element: elementCopy, perc: pos });
//   }
// }
