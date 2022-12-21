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
let li=document.querySelector("#sku-list");
if (!li){
    li=document.querySelector("#price_drops_index > main > section > ol");
}
let kin = li.children;
//GIA STATISTIKA KANW LOAD TO D3 KAI GIA TO CHART TO MIN CHART
// Loop through each product in the table
for (let i = 0; i < kin.length; i++) {
    let link = kin[i].getElementsByClassName("js-sku-link")[2].href.replace(/.html.*/,'/price_graph.json');
  
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
        timePeriods.forEach(period => {
          const values = data['min_price']['graphData'][period]['values'];
          const prices = values.map(v => v['value']).filter(p => p !== 0.0);
          //console.log(prices);
          meanPrices.push(d3.mean(prices));
          medianPrices.push(d3.median(prices));
          stdevPrices.push(d3.deviation(prices));
        });
        //console.log({"mean":meanPrices,"median":medianPrices,"st": stdevPrices});
        // Create a new element to hold the statistical measures
        let stats = document.createElement('div');
        stats.className = 'statistics';
  
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
        pointRadius: 4,
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
        pointRadius: 4,
        pointHoverRadius: 6,
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
        label: 'Minimum price ever',
        data: minEver,
        borderColor: '#3cba9f',
        backgroundColor: '#3cba9f',
        borderDash: [5, 5],
        type: 'line',
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
            //suggestedMin: minEver
          }
        },
        {
          id: 'y-axis-2',
          position: 'right',
          ticks: {
            beginAtZero: true
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