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
