const style = document.createElement("style");

style.innerHTML = `
  .loading-icon {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    border: 2px solid #ccc;
    border-radius: 50%;
    border-top-color: #333;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

document.head.appendChild(style);
let loading = false;
async function reload() {
  let res = await fetch("https://www.skroutz.gr/cart.json");
  let data = await res.json();
  //let obj=processJsonData(data);
  return data;
}
function deleteItem(id) {
  fetch(
    `https://www.skroutz.gr/cart/remove_line_item/ddd.json`.replace("ddd", id),
    { method: "POST" }
  );
}
function emptyCart(items) {
  for (let i of items) {
    deleteItem(i.id);
  }
}
async function safeFetch(
  url,
  method = "GET",
  body = null,
  headers = new Headers()
) {
  let response = await fetch(url, {
    method: method,
    body: body,
    headers: headers,
  });
  let retries = 0;
  while (!response.ok && retries < 5) {
    console.error(`Error: ${response.status}`);
    // Wait for 1 second before retrying
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Retry the request
    response = await fetch(url, {
      method: method,
      body: body,
      headers: headers,
    });
    retries++;
  }

  // Proceed with the response
  return response;
}
async function addtoCart(it, headers = null) {
  let skuid = it["sku_id"];
  let q = it["quantity"];
  if (headers == null) headers = new Headers();
  await safeFetch(
    "https://www.skroutz.gr/cart/add/ddd.json".replace("ddd", skuid),
    "POST",
    JSON.stringify({
      assortments: {},
      express: null,
      from: "sku_product_cards",
      offering_type: null,
      product_id: it["product_id"],
    }),
    headers
  );
  if (q > 1) {
    let re = await fastGetItems();
    let id = re.filter((x) => x.sku_id == skuid)[0].id;
    safeFetch(
      "https://www.skroutz.gr/cart/change_line_item_quantity.json",
      "POST",
      JSON.stringify({
        line_item_id: id,
        quantity: q,
      }),
      { "content-type": "application/json" }
    );
  }
}
async function getProductIdFromProductLink(url, shop_id) {
  let link = url.replace(".html", ".json");
  let res = await safeFetch(link);
  let data = await res.json();
  if (typeof data.data.product_cards == "undefined") return null;
  let id = Object.entries(data.data.product_cards)
    .filter(([k, v]) => v.shop_id == shop_id)
    .map((x) => x[0])
    .reduce((x) => x[0]);
  return parseInt(id);
}
async function getItems() {
  loading = true;
  let res = await fetch("https://www.skroutz.gr/cart.json");
  let data = await res.json();
  let hitems = data["cart"]["line_items"];
  let tes = [];
  while (data.cart.proposals.length == 0) {
    res = await fetch("https://www.skroutz.gr/cart.json");
    data = await res.json();
  }
  for (let p of data.cart.proposals[0].packages) {
    tes.push(...p.items);
  }
  for (let i in tes) {
    let p = tes[i];
    if (items.some((x) => x.id == tes[i].id)) {
      tes[i] = items.filter((x) => x.id == tes[i].id)[0];
    } else {
      let skuid = p.sku_id;
      let it = Object.values(hitems).filter((x) => x.sku_id == skuid)[0];
      let key = Object.keys(hitems).filter((x) => hitems[x] == it)[0];
      p["id"] = parseInt(key);
      p["product_id"] = it.product_id;
      if (p["product_id"]!=null){
        p["product_id"]=parseInt(p["product_id"])
      }
      p["category_id"] = it.category_id;
    }
  }

  for (let p of tes) {
    if (p.product_id == null) {
      // KALESE TO JSON TOU PROIONTOS
      let pid = await getProductIdFromProductLink(p.link, p.shop_id);
      p.product_id = pid;
    }
  }
  loading = false;
  return tes;
}
async function fastGetItems() {
  let res = await fetch("https://www.skroutz.gr/cart/line_items.json");
  let data = await res.json();
  let it = data.cart.line_items;
  for (key in it) {
    it[key]["id"] = key;
  }
  return Object.values(it);
}
var cartsLoaded;
var cartsObj=[];
let items = [];
const h1 = document.querySelector("#react-cart-page");
if (typeof button == "undefined") {
  addButton(h1);
  addWeightsButton(h1);
  addLoadButton(h1);
  addSaveButton(h1);
  getCarts();
}
function addButton(h1) {
  // Create a new button element
  var button = document.createElement("button");

  // Create an img element
  var img = document.createElement("img");

  // Set the src attribute of the img element to the desired image URL
  //let delurl=chrome.runtime.getURL("./images/delete.png");
  let delurl =
    "https://fileswin.com/wp-content/uploads/2017/11/PC-Decrapifier-Logo.png";
  //img.innerHTML=`<img id="icon" src="./images/delete.png">`
  img.src = delurl;
  img.setAttribute("height", "32");
  img.setAttribute("weight", "32");

  // Append the img element to the button element
  button.appendChild(img);
  button.setAttribute("type", "button");
  // Set the onclick attribute of the button element to the desired function
  button.setAttribute("title", "Άδεισμα ολόκληρου καλαθιού!");
  button.style.marginLeft = "25em";
  // Select the reference node
  var referenceNode = h1.firstChild;

  // Insert the button element before the reference node
  h1.insertBefore(button, referenceNode);

  button.addEventListener("click", async function () {
    let fastcart = await fastGetItems();
    emptyCart(fastcart);
  });
}
function addWeightsButton(h1) {
  // Create a new button element
  var button = document.createElement("button");

  // Create an img element
  var img = document.createElement("img");

  // Set the src attribute of the img element to the desired image URL
  let delurl = "https://img.icons8.com/small/64/weight.png";
  //img.innerHTML=`<img id="icon" src="./images/delete.png">`
  img.src = delurl;
  img.setAttribute("height", "32");
  img.setAttribute("weight", "32");

  // Append the img element to the button element
  button.appendChild(img);
  button.setAttribute("type", "button");
  // Set the onclick attribute of the button element to the desired function
  button.setAttribute("title", "(BETA) Υπολόγισε τα πρόσθετα βάρη των προϊόντων!");
  button.style.marginRight = "3em";
  // Select the reference node
  var referenceNode = h1.firstChild;

  // Insert the button element before the reference node
  h1.insertBefore(button, referenceNode);

  button.addEventListener("click", async function () {
    //const element = document.getElementById("some-element");
    if (button.children.length > 1) {
      let pop = button.getElementsByClassName("popup")[0];
      pop.remove();
    }
    const loadingIcon = document.createElement("div");
    loadingIcon.classList.add("loading-icon");

    button.appendChild(loadingIcon);
    items = await getItems();
    //console.log(copycart)
    let d = await calculateWeights();
    button.removeChild(loadingIcon);
    if (d.done == false) {
      emptyCart(await fastGetItems());
      addItems(items);
    }
    const popupElement = document.createElement("div");
    popupElement.classList.add("popup");
    let out = "";
    console.log(d.data);
    for (let key in d.data) {
      if (d.data[key]["weights"].length == 0) continue;
      out += key + " " + d.data[key]["weights"].join(", ") + "\n";
    }
    popupElement.innerText = d.text + "\n" + out;

    //const element = document.querySelector("#some-element");
    const rect = button.getBoundingClientRect();

    // Set the position of the popup element
    popupElement.style.left = `${rect.left}px`;
    popupElement.style.top = `${rect.bottom}px`;

    // Add the popup element to the document
    button.appendChild(popupElement);

    setTimeout(() => {
      for (let [shop, val] of Object.entries(d.data)) {
        let txt = val.weights.join(", ");
        // for (let w of val.weights){
        //   txt+=w+" "
        // }
        let a = document.getElementsByTagName("span");
        for (let b of a) {
          if (b.textContent.includes(shop))
            b.innerText += "   χρεώνει αντίστοιχα αθροιστικά: " + txt;
        }
      }
    }, "3500");
    //for (let key in d.data){console.log(key,d.data[key]['weights'].join(", "));}
  });
}
function addLoadButton(h1) {
  // Create a new button element
  var button = document.createElement("button");

  // Create an img element
  var img = document.createElement("img");

  // Set the src attribute of the img element to the desired image URL
  //let delurl=chrome.runtime.getURL("./images/delete.png");
  let delurl = "https://img.icons8.com/small/64/opened-folder.png";
  //img.innerHTML=`<img id="icon" src="./images/delete.png">`
  img.src = delurl;
  img.setAttribute("height", "32");
  img.setAttribute("weight", "32");

  // Append the img element to the button element
  button.appendChild(img);
  button.setAttribute("type", "button");
  // Set the onclick attribute of the button element to the desired function
  button.setAttribute("title", "Φόρτωσε αποθηκευμένα καλάθια!");
  button.style.marginLeft = "3em";
  button.style.marginRight="3em"
  // Select the reference node
  var referenceNode = h1.firstChild;
  // getCarts(function (carts) {
  //   cartsLoaded = carts;
  //   for (let i of cartsLoaded){
  //     let minicart=[]
  //     for (let j of i[2]){
  //       minicart.push({sku_id:j[0],quantity:j[1],product_id:j[2]})
  //     }
  //     let cartObj={date:i[0], time:i[1], cart:minicart}
  //     cartsObj.push(cartObj)
  //   }
  //   cartsObj.sort((a,b)=>{
  //     if (a.date>b.date) return -1;
  //     else return 1;
  //   })
  // });
  getCarts();
  // Insert the button element before the reference node
  h1.insertBefore(button, referenceNode);
  const popup = document.createElement("div");
  popup.id = "cart-popup";
  const rect = button.getBoundingClientRect();

  popup.classList.add("popup"); // Add a class to style the popup

  // Set the position and dimensions of the popup element
  popup.style.left = `${rect.left}px`;
  popup.style.top = `${rect.bottom}px`;
  popup.style.width = "200px";
  popup.style.height = "300px";
  popup.style.display = "none";
  popup.style.overflowY = "scroll";

  button.appendChild(popup);
  popup.addEventListener("click", (event) => {
    event.preventDefault();
  });
  const cartContainer = document.createElement("div");
  cartContainer.classList.add("cart-container");
  popup.appendChild(cartContainer);
  button.addEventListener("mouseover", async function () {
    // Toggle the visibility of the popup element
    if (popup.style.display === "none") {
      popup.style.display = "block";
      // Loop through the array of carts
     
      for (const cart of cartsObj) {
        // Create the container element for the cart
        // Add a class to style the container

        // Create the text element for the cart's name
        const cartName = document.createElement("p");
        cartName.textContent = cart.name; // Set the text content to be the cart's name
        cartName.classList.add("cart-name"); // Add a class to style the text element

        // Create the smaller text element for the cart's date
        const cartDate = document.createElement("p");
        cartDate.textContent = new Date(cart.date*1000).toLocaleString(); // Set the text content to be the cart's date
        cartDate.classList.add("cart-date"); // Add a class to style the text element

        // Create the delete icon element
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete"; // Set the text content to be "Load"
        deleteButton.classList.add("delete-savedcart-button"); // Add a class to style the button
        deleteButton.addEventListener("click", function () {
          cartsObj = cartsObj.filter((item) => item != cart);
          cartsLoaded=Array.from(cartsLoaded).filter(x=>x[0]!=cart.date)
          chrome.storage.sync.set({ Carts: cartsLoaded }, function () {
            console.log("Deleted cart from chrome.storage.sync");
          });
        });
        // Create the load button element
        const loadButton = document.createElement("button");
        loadButton.textContent = "Load"; // Set the text content to be "Load"
        loadButton.classList.add("load-savedcart-button"); // Add a class to style the button
        loadButton.addEventListener("click", function () {
          console.log(cart.cart);
          addItems(cart.cart);
          cartContainer.replaceChildren();
          popup.style.display = "none";
        });

        // Append the text elements, delete icon, and load button to the container element
        cartContainer.appendChild(cartName);
        cartContainer.appendChild(cartDate);
        cartContainer.appendChild(deleteButton);
        cartContainer.appendChild(loadButton);

        // Append the container element to the popup element
      }
    }
    // const popup = document.createElement("div");

    // Append the popup to the document
  });
  button.addEventListener("mouseleave", function () {
    cartContainer.replaceChildren();
    popup.style.display = "none";
  });
}
function addSaveButton(h1) {
  // Create a new button element
  var button = document.createElement("button");

  // Create an img element
  var img = document.createElement("img");

  // Set the src attribute of the img element to the desired image URL
  let delurl = "https://img.icons8.com/small/64/save.png";
  img.src = delurl;
  img.setAttribute("height", "32");
  img.setAttribute("weight", "32");

  // Append the img element to the button element
  button.appendChild(img);
  button.setAttribute("type", "button");
  // Set the onclick attribute of the button element to the desired function
  button.setAttribute("title", "Αποθήκευσε το καλάθι!");
  //button.style.marginRight = "3em";
  button.style.marginLeft="3em";
  // Select the reference node
  var referenceNode = h1.firstChild;

  // Insert the button element before the reference node
  h1.insertBefore(button, referenceNode);
  const popup = document.createElement("div");
  popup.id = "cart-popup";
  const rect = button.getBoundingClientRect();
  popup.classList.add("popup");
  popup.style.left = `${rect.left}px`;
  popup.style.top = `${rect.bottom}px`;
  popup.style.display = "none";
  //popup.style.overflowY = "scroll";
  button.appendChild(popup);
  // Create the text field and "Save" button
  const inputField = document.createElement("input");
  inputField.type = "text";
  inputField.placeholder = "Enter a name for this cart";
  inputField.classList.add("input-field");
  popup.appendChild(inputField);

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save";
  saveButton.classList.add("save-button");
  popup.appendChild(saveButton);
  popup.addEventListener("click", (event) => {
    event.preventDefault();
  });
  // Add an event listener to the "Save" button
  saveButton.addEventListener("click", async () => {
    const name = inputField.value;
    let sresp = await saveCart(name);
    const popupElement = document.createElement("div");
    popupElement.classList.add("popup");
    if (!sresp) popupElement.textContent = "Δεν Αποθηκεύτηκε";
    else popupElement.textContent = "Αποθηκεύτηκε";

    //const element = document.querySelector("#some-element");
    const rect = button.getBoundingClientRect();

    // Set the position of the popup element
    popupElement.style.left = `${rect.left}px`;
    popupElement.style.top = `${rect.bottom}px`;

    // Add the popup element to the document
    button.appendChild(popupElement);

    // Set a timeout to remove the popup element after 1 second
    setTimeout(() => {
      popupElement.remove();
    }, 1000); // Call the saveCart function with the input name as the argument
  });
  button.addEventListener("mouseover", async function () {
    // Show the popup element
    popup.style.display = "block";
  });

  button.addEventListener("mouseout", function () {
    // Hide the popup element
    popup.style.display = "none";


  });
}

async function safeGet(url){
let res=await fetch(url);
let data= await res.json();
return data.reviews.reviews;

}

function list2IncludesList1(itemslist1, itemslist2) {
  //elegxos gia sku id kai quantity
  //if (itemslist1.length != itemslist2.length) return false;
  return itemslist1.every((x) => {
    let el = itemslist2.filter((y) => y.sku_id == x.sku_id)[0];
    if (el) {
      if (el.quantity == x.quantity) return true;
    }
    return false;
  });
}
async function getCartData(pusheditems) {
  let test = await fastGetItems();
  let count=0;
  while (list2IncludesList1(pusheditems,test)) {
    test = await fastGetItems();
    count++
    if (count>=20) return null
  }
  let cart = await reload();
  let proposals = cart.cart.proposals;
  count=0;
  let done=false
  while (proposals.length == 0) {
    cart = await reload();
    console.log(cart.line_items);
    proposals = cart.cart.proposals;
    count++
    setTimeout(async () => {
      if (count>=15) {done=true}
      if (done==true) return null;}, 100)
    
  }
  let packages = proposals[0].packages;
  let shdata = proposals[0].summary.shipping_data_per_shop;
  return { p: packages, sd: shdata };
}
async function calculateWeights() {
  let clone = structuredClone(items);
  emptyCart(items);
  //an thelw kanw sort edw sto clone analoga tis times
  clone.sort((a, b) => {
    // Extract the cost values from the "total_cost" properties
    const aCost = parseFloat(a.total_cost.replace(/,/, '.').replace(/\s€/, ''));
    const bCost = parseFloat(b.total_cost.replace(/,/, '.').replace(/\s€/, ''));
  
    // Compare the cost values and return the comparison result
    if (aCost < bCost) return -1;
    if (aCost > bCost) return 1;
    return 0;
  });
  console.log(clone.map(x=>x.total_cost));
  let data = {};
  let have = [];
  try {
    while (clone.length > 0) {
      let names = {};
      let pushitems = clone.filter((x) => {
        if (names.hasOwnProperty(x.shop_id.toString())) {
          return false;
        } else {
          names[x.shop_id] = x.id;
          //names.push(x.shop_id);
          return true;
        }
      });
      addItems(pushitems);
      let temp=await getCartData(pushitems);
      if (temp==null) return {
        text: "Kάτι πήγε λάθος. Ξαναδοκιμάστε.",
        data: data,
        done: false,
      };
      let { p: packages, sd: shdata } =temp 
      for (let p of packages) {
        let shname = p.shop_info.name;
        if (!data.hasOwnProperty(shname)) {
          data[shname] = { weights: [], items: [] };
        } 
          let shippingofp = shdata.filter((x) => x.name == shname)[0];
          if (shippingofp) {
            data[shname]["weights"].push(shippingofp.weight);
            console.log(shname, shippingofp.weight);
            data[shname]["items"] = p.items;
            // data[shname]={weights:shippingofp.weight, items:p.items}
          }
  
      }
      clone = clone.filter((x) => !pushitems.includes(x));
    }
    return { text: "Ολοκληρώθηκε", data: data, done: true };
  } catch (error) {
    console.log(error);
    return {
      text: "Kάτι πήγε στραβά. Ξαναδοκιμάστε.",
      data: data,
      done: false,
    };
  }
}

function addItems(items) {
  for (let i of items) {
    addtoCart(i);
  }
}

async function saveCart(name = "") {
  items = await getItems();
  //let c = await getItems();
  let smallitems=[];
  let smallitemsobj=[];
  if (items.length == 0) {
    console.log("no items");
    return false;
  } else {
    for (let i of items){
      smallitemsobj.push({sku_id:i.sku_id,quanity: i.quantity,product_id: i.product_id})
      smallitems.push(i.sku_id,i.quantity,i.product_id)
    }
    let d = new Date();

    
    let timestamp=Math.round(d.getTime()/1000)
    let cartArr=[timestamp,name,smallitems]
    cartsLoaded.push(cartArr); // Add the new cart object to the array
    
    // Save the updated Carts array to chrome.storage.sync
    chrome.storage.sync.set({ Carts: cartsLoaded }, function () {
      console.log("Cart saved to chrome.storage.sync");
    });
    let cartObj = {date: timestamp, name: name, cart: smallitemsobj}
    cartsObj.push(cartObj)
    cartsObj.sort((a,b)=>{
      if (a.date>b.date) return -1;
      else return 1;
    })
    return true;
  }
}

Object.defineProperty(Array.prototype, 'chunk', {
  value: function(chunkSize) {
    var R = [];
    for (var i = 0; i < this.length; i += chunkSize)
      R.push(this.slice(i, i + chunkSize));
    return R;
  }
});

function getCarts() {
  chrome.storage.sync.get(["Carts"], function (items) {
    let carts = items.Carts || []; // Set to an empty array if it doesn't exist
    cartsLoaded = carts;
    cartsObj=[];
    for (let i of cartsLoaded){
      let minicart=[]
      if (i[2].length>0 && typeof(i[2][0])!="object") i[2]=i[2].chunk(3);
      for (let j of i[2]){
        minicart.push({sku_id:j[0],quantity:j[1],product_id:j[2]})
      }
      let cartObj={date:i[0], name:i[1], cart:minicart}
      cartsObj.push(cartObj)
    }
    cartsObj.sort((a,b)=>{
      if (a.date>b.date) return -1;
      else return 1;
    })
  });
}

