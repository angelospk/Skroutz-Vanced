// Step 1: Select the element to be removed
console.log("Hey");
let elementToRemove = document.querySelector('.featured-product-card');
//console.log(elementToRemove);
// Step 2: Check if the element exists
if (elementToRemove) {
  // Step 3: Get the parent element of the element to be removed
  let parentElement = elementToRemove.parentElement;

  // Step 4: Remove the element from the parent element
  parentElement.removeChild(elementToRemove);
}
