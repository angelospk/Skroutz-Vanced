const products = [
  {
    "minpr": 37.5,
    "lastTimestamp": 1661893200,
    "day": 9,
    "skuid": 34858302,
    "title": "Level Anatomic 3081 Ανδρικά Sneakers Μαύρα",
    "pososto": 4
  },
  // Other products go here
];

// Create a container element for the table
const tableContainer = document.createElement('div');
tableContainer.style.display = 'flex';
tableContainer.style.flexDirection = 'column';

// Create the table element
const table = document.createElement('div');
table.style.display = 'flex';
table.style.flexDirection = 'column';
table.style.alignItems = 'stretch';

// Add the table to the container
tableContainer.appendChild(table);

// Iterate through the first 50 products
for (let i = 0; i < 50 && i < products.length; i++) {
  const product = products[i];

  // Calculate the price and difference based on the product data
  const price = product.minpr * (1 - product.pososto / 100);
  const difference = price - product.minpr;

  // Create a row element
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.alignItems = 'center';

  // Create the title element
  const title = document.createElement('a');
  title.innerText = product.title;
  title.href = `www.skroutz.gr/s/${product.skuid}/${product.title}.html`;
  title.style.flex = 1;

  // Create the percentage element
  const percentage = document.createElement('div');
  percentage.innerText = `${product.pososto}%`;
  percentage.style.flex = 1;
  percentage.style.textAlign = 'center';

// Add event listeners to the table headers
percentageHeader.addEventListener('click', () => {
  sortList('percentage');
});
differenceHeader.addEventListener('click', () => {
  sortList('difference');
});
}
// Sorting function
function sortList(sortBy) {
  // Sort the products based on the chosen column
  products.sort((a, b) => {
    return a[sortBy] - b[sortBy];
  });

  // Update the table with the sorted list
  updateTable();
}

// Function to update the table with the sorted list
function updateTable() {
  // Clear the table
  table.innerHTML = '';

  // Add the first 50 products to the table
  for (let i = 0; i < 50; i++) {
    const product = products[i];
    table.innerHTML += `
      <tr>
        <td><a href="www.skroutz.gr/s/${product.skuid}/${product.title}.html">${product.title}</a></td>
        <td>${product.percentage}</td>
        <td>${product.price}</td>
        <td>${product.difference}</td>
      </tr>
    `;
  }
}
