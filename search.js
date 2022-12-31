
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
        parentElement.style.display="none";
    }
  }
}
  blurSp();
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