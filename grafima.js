/*
const getSimpleStatisticsFromUnpkg = async () =>{ await import("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js");
await import("https://d3js.org/d3.v7.min.js"); await import("https://cdn.anychart.com/releases/8.8.0/js/anychart-base.min.js");};

const getpackages= getSimpleStatisticsFromUnpkg().then(x=>{console.log("tpt");})*/
/*
(async () => {
  const d3 = chrome.extension.getURL('d3.v7.min.js');
  const Chart = chrome.extension.getURL('Chart.js');
})(); 
import * as d3 from './d3.v7.min';
import * as Chart from './Chart';*/
function isSpons(elem){
  if (elem.querySelector("li span.label-text") || elem.querySelector("label-text"))  return true;
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
        parentElement.style.display="block";
    }
  }
}

var h1 = document.getElementsByClassName("page-title")[0];
if (typeof button == "undefined") {
  addButton(h1);
  addSortButton(h1);
  //console.log("evala koumpi gia grafima kai gia sorting");
}
const targetNode = getList();
const observer = new MutationObserver((mutations) => {
  // Iterate through the mutations and run your script for each mutation
  //console.log("updated");
  if (mutations.length > 10) {
    blurSp();
    getGraphs();
  }
  mutations.forEach((mutation) => {
    // Run your script
    //getGraphs();
  });
});

// Configure the observer to watch for childList and attribute changes
const config = { childList: true, attributes: true };

// Start observing the target node for configured mutations
observer.observe(targetNode, config);

//var kin;
let elementStyle;
//let percentages=[];
let lista = [];
//[lista, percentages]=getGraphs();
getGraphs();
//console.log(percentages.length,lista.length);
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
  elementStyle=getComputedStyle(kin[0])
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
        const minEver = data["min_price"]["min"];
        kin[i].getElementsByClassName;
        const timePeriods = Object.keys(data["min_price"]["graphData"]);
        timePeriods.reverse();
        const meanPrices = [];
        const medianPrices = [];
        const stdevPrices = [];
        const minPrices = [];
        timePeriods.forEach((period) => {
          const values = data["min_price"]["graphData"][period]["values"];
          const prices = values.map((v) => v["value"]).filter((p) => p !== 0.0);
          //console.log(prices);
          meanPrices.push(d3.mean(prices));
          medianPrices.push(d3.median(prices));
          stdevPrices.push(d3.deviation(prices));
          minPrices.push(Math.min(...prices));
        });
        //console.log({"mean":meanPrices,"median":medianPrices,"st": stdevPrices});
        // Create a new element to hold the statistical measures
        let stats = document.createElement("div");
        stats.className = "statistics";
        //let timi_el;
        let gram = document.createElement("span");
        gram.innerText = `ιστορικό χαμηλό: ${minEver}`;
        let pos;
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
          gram.innerText += pos.toString() + "%)";
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
                label: "Ελάχιστη τιμή",
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

function sortElems() {
  if (!lista.length) {
    return null;
  }

  // Sort the elements based on the perc property
  lista.sort((a, b) => {
    // Compare the perc property
    if (a.perc > b.perc) {
      return -1;
    } else if (a.perc < b.perc) {
      return 1;
    } else {
      return 0;
    }
  });
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
  button.setAttribute("title", "Διέγραψε όλα τα αποθηκευμένα διαγράμματα ελάχιστης τιμής!");
  button.style.marginLeft = "20em";
  // Select the reference node
  //var referenceNode = h1.firstChild;

  // Insert the button element before the reference node
  h1.appendChild(button);

  button.addEventListener("click", function () {
    lista=[];
    //console.log("διαγράφτηκαν τα διαγράμματα!");
  });
}

function addSortButton(h1) {
  // Create a new button element
  var button = document.createElement("button");

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
    "Ταξινόμησε όλα τα προϊόντα που είδες ανάλογα με το ποσοστό απόκλισης από το ιστορικό χαμηλό!"
  );
  button.style.marginLeft = "3em";
  // Select the reference node
  //var referenceNode = h1.firstChild;

  // Insert the button element before the reference node
  h1.appendChild(button);

  button.addEventListener("click", function () {
    //sortElems();
    //console.log("Sorted!");
    // Create a new div element to hold the sorted elements

    sortElems();
    const popUpElement = document.createElement("div");

    //const popUpElement = document.createElement('div');

    // Set the innerHTML of the div element to the content of the pop-up
    //popUpElement.innerHTML ="<p>Όσα προϊόντα είδες ταξινομημένα κάτα ποσοστό απόκλισης από ιστορικό χαμηλό!</p>";

    // Set the styling of the pop-up element
    popUpElement.style.position = "fixed";
    popUpElement.style.top = "50%";
    popUpElement.style.left = "50%";
    popUpElement.style.transform = "translate(-50%, -50%)";
    popUpElement.style.background = "white";
    popUpElement.style.width = "90%";
    popUpElement.style.height = "80%";
    popUpElement.style.zIndex = "9999";
    popUpElement.style.boxShadow = "20px 20px 30px #00000066";
    popUpElement.style.borderRadius = "10px";
    popUpElement.setAttribute("tabIndex", "0");
    popUpElement.style.overflow = "scroll";
    popUpElement.style.textAlign = "center";
    popUpElement.style.padding = "20px";
   
    
    const textlabel=document.createElement("div");
    textlabel.innerHTML="<p><b>Όσα προϊόντα είδες ταξινομημένα κάτα ποσοστό απόκλισης από ιστορικό χαμηλό!</b></p>";
    textlabel.style.color = "black";
    textlabel.style.fontSize = "2.3em";
    popUpElement.appendChild(textlabel);

    const closeIconElement = document.createElement("img");
    let delurl =
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrM48tgSdjAHG3UrvzCzWdTKAdu3DqhOdUKg&usqp=CAU";
    //img.innerHTML=`<img id="icon" src="./images/delete.png">`
    closeIconElement.src = delurl;
    closeIconElement.setAttribute("height", "32");
    closeIconElement.setAttribute("weight", "32");
    closeIconElement.style.position = 'fixed';
closeIconElement.style.top = '20px';
closeIconElement.style.right = '20px';
    //closeIconElement.src = 'close-icon.png';

    // Append the close icon element to the pop-up element
    popUpElement.appendChild(closeIconElement);

    const sorted=document.createElement("div")
    
    sorted.style.display = 'flex';
    sorted.style.flexWrap = 'wrap';
    
    
    popUpElement.appendChild(sorted);
    // Append the pop-up element to the body
    //document.body.appendChild(popUpElement);

    //popUpElement.appendChild(lista[0].element);
    //popUpElement.appendChild(lista[1].element);
    // Append the pop-up element to the body
    //popUpElement.style.display = 'flex';
    //popUpElement.style.flexWrap = 'wrap';

lista.forEach(obj => {
  obj.element.style.cssText = elementStyle.cssText;
  obj.element.style.flex = '0 2 10%';
  obj.element.querySelector('img').style.maxWidth = '100%';
  obj.element.querySelector('img').style.maxHeight = '100%';
  //obj.element.style.maxWidth = '200px';
  
  obj.element.style.margin = '10px';
  sorted.appendChild(obj.element);
});

    // Set the innerHTML of the div element to the sorted elements
    //popUpElement.innerHTML = sortElems();
    //popUpElement.innerText="hey testing";

    // Create a close icon element
    

    document.body.appendChild(popUpElement);
    // Add an event listener to the close icon element to handle the click event
    closeIconElement.addEventListener("click", () => {
      // Remove the pop-up element from the document
      popUpElement.remove();
    });

    /*
  document.body.addEventListener('click', event => {
    if (event.target !== popUpElement && event.target !== closeIconElement) {
      popUpElement.remove();
    }
  });

  */

    //console.log("Sorted!");
  });
}

// Later, you can stop observing the target node
//observer.disconnect();
