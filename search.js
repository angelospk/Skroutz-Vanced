// Step 1: Select all elements to be removed
let elementsToRemove = document.querySelectorAll('li span.label-text');
if (elementsToRemove.length==0) elementsToRemove=document.querySelectorAll('label-text');

// Step 2: Check if any elements were found
if (elementsToRemove.length > 0) {
  // Step 3: Iterate over all filtered elements and remove them one by one
  for (let element of elementsToRemove) {
    let parentElement = element.parentElement.parentElement.parentElement;
    parentElement.remove();
  }
}
/*

import { Chart } from '/path/to/Chart.js';
import { d3 } from '/path/to/d3.v7.min.js';

const getSimpleStatisticsFromUnpkg = async () =>{ await import("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js");
await import("https://d3js.org/d3.v7.min.js"); await import("https://cdn.anychart.com/releases/8.8.0/js/anychart-base.min.js");};

getSimpleStatisticsFromUnpkg().then(x=>{
  console.log("edw");
  getGraphs()});


*/
getGraphs();

var h1=document.getElementsByClassName("page-title")[0];
if (typeof(button)=="undefined") {
  addButton(h1);
  console.log("evala koumpi gia grafima");
}
function getGraphs(){
  var li;
  try{
  li=document.querySelector("#sku-list");}
  catch{
  li=document.querySelector("#price_drops_index > main > section > ol");
  }
  var kin = li.children;
  //GIA STATISTIKA KANW LOAD TO D3 KAI GIA TO CHART TO MIN CHART
  // Loop through each product in the table
  for (let i = 0; i < kin.length; i++) {
    let link;
    try {
      link = kin[i].getElementsByClassName("js-sku-link")[2].href.replace(/.html.*/,'/price_graph.json');
    }  
    catch{
       continue;
    }
    
    
      // Load the data for the product
      fetch(link)
        .then(response => response.json())
        .then(data => {
          // Extract the data for each time period
          const minEver=data["min_price"]["min"];
          const timePeriods = Object.keys(data['min_price']['graphData']);
          timePeriods.reverse();
          const meanPrices = [];
          const medianPrices = [];
          const stdevPrices = [];
          const minPrices=[];
          timePeriods.forEach(period => {
            const values = data['min_price']['graphData'][period]['values'];
            const prices = values.map(v => v['value']).filter(p => p !== 0.0);
            //console.log(prices);
            meanPrices.push(d3.mean(prices));
            medianPrices.push(d3.median(prices));
            stdevPrices.push(d3.deviation(prices));
            minPrices.push(Math.min(...prices));
          });
          //console.log({"mean":meanPrices,"median":medianPrices,"st": stdevPrices});
          // Create a new element to hold the statistical measures
          let stats = document.createElement('div');
          stats.className = 'statistics';
          
          textNode = document.createTextNode(`ρεκόρ ελάχιστης τιμής: ${minEver}`);
          kin[i].appendChild(textNode);
    
          // Insert the statistical measures into the element
          const ctx = document.createElement('canvas');
          ctx.className='grafima';
          const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: timePeriods,
      datasets: [
        {
          label: 'Μέση τιμή',
          data: meanPrices,
          borderColor: '#3e95cd',
          backgroundColor: '#3e95cd',
          type: 'line',
          pointRadius: 2,
          pointHoverRadius: 3,
          fill: false,
          spanGaps: true,
          yAxisID: 'y-axis-1'
        },
        {
          label: 'Διάμεσος',
          data: medianPrices,
          borderColor: '#3cba9f',
          backgroundColor: '#3cba9f',
          type: 'line',
          pointRadius: 2,
          pointHoverRadius: 3,
          fill: false,
          showLine: true,
          yAxisID: 'y-axis-1'
        },
        {
          label: 'Πάνω όριο τυπ. απόκλισης',
          data: meanPrices.map((mean, i) => mean + stdevPrices[i]),
          borderColor: '#000000',
          backgroundColor: '#000000',
          type: 'line',
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          showLine: true,
          yAxisID: 'y-axis-1'
        },
        {
          label: 'Κάτω όριο τυπ. απόκλισης',
          data: meanPrices.map((mean, i) => mean - stdevPrices[i]),
          borderColor: '#000000',
          backgroundColor: '#000000',
          type: 'line',
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          showLine: true,
          yAxisID: 'y-axis-1'
        },      
        {
          label: 'Ελάχιστη τιμή',
          data: minPrices,
          borderColor: '#FF0000',
          backgroundColor: '#FF0000',
          type: 'line',
          borderDash: [2, 2],
          pointRadius: 2,
          pointHoverRadius: 3,
          fill: false,
          showLine: true,
          yAxisID: 'y-axis-1'
        }
      ]
    },
    options: {
      legend:{display: false},scales: {
        yAxes: [
          {
            id: 'y-axis-1',
            position: 'left',
            ticks: {
              beginAtZero: false,
              suggestedMin: Math.min(...minPrices)
            }
          },
          {
            id: 'y-axis-2',
            position: 'right',
            ticks: {
              beginAtZero: false
            }
          }
        ]
      }
    }
  });    
  // Add the element to the DOM
  kin[i].appendChild(ctx);
  const chartContainer = kin[i].querySelector('.grafima');
  })};
  
  }

  function addButton(h1) {
    // Create a new button element
    var button = document.createElement('button');
  
    // Create an img element
    var img = document.createElement('img');
  
    // Set the src attribute of the img element to the desired image URL
    //let delurl=chrome.runtime.getURL("./images/delete.png");
    let delurl="https://www.iconpacks.net/icons/1/free-chart-icon-646-thumb.png";
    //img.innerHTML=`<img id="icon" src="./images/delete.png">`
    img.src=delurl;
    img.setAttribute('height', "32");
    img.setAttribute('weight',"32");
  
    // Append the img element to the button element
    button.appendChild(img);
    button.setAttribute('type', 'button');
    // Set the onclick attribute of the button element to the desired function
    button.setAttribute('title', 'Φόρτωσε διαγράμματα ελάχιστης τιμής!');
    button.style.marginLeft="25em";
    // Select the reference node
    //var referenceNode = h1.firstChild;
  
    // Insert the button element before the reference node
    h1.appendChild(button);
  
    button.addEventListener('click', function() {
      getGraphs()
      console.log("new graphs added!");
    });
  }


/*
const getSimpleStatisticsFromUnpkg = async () =>{ await import("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js");
await import("https://d3js.org/d3.v7.min.js"); await import("https://cdn.anychart.com/releases/8.8.0/js/anychart-base.min.js");};

const getpackages= getSimpleStatisticsFromUnpkg();

(async () => {
  const d3 = chrome.extension.getURL('d3.v7.min.js');
  const Chart = chrome.extension.getURL('Chart.js');
})(); 
import * as d3 from './d3.v7.min';
import * as Chart from './Chart';*/
