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

var h1 = document.getElementsByClassName("page-title")[0];
if (typeof button == "undefined") {
  addButton(h1);
  addSortButton(h1);
  console.log("evala koumpi gia grafima kai gia sorting");
}
//var kin;
let sorted=false;
//let percentages=[];
let lista=[];
//[lista, percentages]=getGraphs();
getGraphs();
//console.log(percentages.length,lista.length);
function getList(){
  try {
    li = document.querySelector("#sku-list");
    kin = li.children;
    //return document.querySelector("#sku-list").children;
    return li
  } catch {
    //pairnw ti lista an eimai sti selida prosfores
    kin = document.getElementsByClassName("js-sku cf card ");
    if (kin.length) {//return document.getElementsByClassName("js-sku cf card ");
    return  kin[0].parentElement;}
    else {
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
  if (kin==null) return null;
  //let pososta=[];

  //GIA STATISTIKA KANW LOAD TO D3 KAI GIA TO CHART TO MIN CHART
  // Loop through each product in the table
  for (let i = 0; i < kin.length; i++) {
    //elegxos an yparxei idi grafima, an nai proxwraei sto epomeno stoixeio
    if (kin[i].getElementsByTagName("canvas").length) {
      continue;
    }
    
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
          if (pos>=-10) {
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
        if (pos!='undefined'){
          //percentages.push(pos);
          //lista.push(kin[i]);
          lista.push({ element: kin[i], perc: pos });
        }
      });
  }
  //return [kin, pososta];
}

function sortElems() {
  if (!lista.length || sorted == true) {
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
  let skuList = getList();
  while (skuList.firstChild) {
    skuList.removeChild(skuList.firstChild);
  }

  // Add the sorted li elements to the sku-list element
  lista.forEach(obj => skuList.appendChild(obj.element));
  /*
  
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
    "https://www.iconpacks.net/icons/1/free-chart-icon-646-thumb.png";
  //img.innerHTML=`<img id="icon" src="./images/delete.png">`
  img.src = delurl;
  img.setAttribute("height", "32");
  img.setAttribute("weight", "32");

  // Append the img element to the button element
  button.appendChild(img);
  button.setAttribute("type", "button");
  // Set the onclick attribute of the button element to the desired function
  button.setAttribute("title", "Φόρτωσε διαγράμματα ελάχιστης τιμής!");
  button.style.marginLeft = "25em";
  // Select the reference node
  //var referenceNode = h1.firstChild;

  // Insert the button element before the reference node
  h1.appendChild(button);

  button.addEventListener("click", function () {
    getGraphs();
    console.log("new graphs added!");
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
  button.setAttribute("title", "Ταξινόμησε ανάλογα με το ποσοστό απόκλισης από ιστορικό χαμηλό!");
  button.style.marginLeft = "3em";
  // Select the reference node
  //var referenceNode = h1.firstChild;

  // Insert the button element before the reference node
  h1.appendChild(button);

  button.addEventListener("click", function () {
    sortElems();
    console.log("Sorted!");
  });
}