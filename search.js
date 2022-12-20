// Step 1: Select all elements to be removed
let elementsToRemove = document.querySelectorAll('li span.label-text');

// Step 2: Check if any elements were found
if (elementsToRemove.length > 0) {
  // Step 3: Iterate over all filtered elements and remove them one by one
  for (let element of elementsToRemove) {
    let parentElement = element.parentElement.parentElement.parentElement;
    parentElement.remove();
  }
}
