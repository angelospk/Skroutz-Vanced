// Create a style element
const style = document.createElement("style");

// Add the CSS rules as the text content of the style element
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

// Append the style element to the head of the document
document.head.appendChild(style);

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
  for (let i in items){
    deleteItem(i.id);
  }
}
async function safeFetch(url, method, body=null, headers = new Headers()){
  console.log(url, method, body, headers);
  let response = await fetch(url,{method:method, body: body, headers: headers});
let retries = 0;
console.log(response);
while (!response.ok && retries < 5) {
  console.error(`Error: ${response.status}`);
  // Wait for 1 second before retrying
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // Retry the request
  response =  await fetch(url,{method: method, body: body, headers: headers});
  retries++;
}

// Proceed with the response
return response;
}
async function addtoCart(it,headers=null) {
  let skuid=it["sku_id"];
  let q=it["quantity"];
  if (headers==null) headers=new Headers();
  await safeFetch(
    "https://www.skroutz.gr/cart/add/ddd.json".replace("ddd", skuid), "POST", JSON.stringify({
      assortments: {},
      express: null,
      from: "sku_product_cards",
      offering_type: null,
      product_id: it["product_id"]}), headers
    );
  if (q > 1) {
    let re = await getItems();
    let id;
    for (let [j, val] of Object.entries(re)) {
      if (val["sku_id"] == skuid) {
        console.log(val,it);
        id = j;
      }
    }
   await safeFetch("https://www.skroutz.gr/cart/change_line_item_quantity.json",
      "POST",
      JSON.stringify({
        line_item_id: parseInt(id),
        quantity: q,
      }),
      { "content-type": "application/json" }
    );
  }
  let data = await reload();
  return data;
}
async function getProductIdFromProductLink(url, shop_id){
  let link=url.replace(".html",".json");
  let res=await fetch(link);
  let data=await res.json();
  let id=Object.entries(data.data.products_specs).filter(([k,v])=>v.shop_id==shop_id).map(x=>x[0]).reduce(x=>x[0])
  return parseInt(id);
}
async function getItems() {
  let res = await fetch("https://www.skroutz.gr/cart.json");
  let data = await res.json();
  let items = data["cart"]["line_items"];
  let tes=[];
  while (data.cart.proposals.length==0){
  let res = await fetch("https://www.skroutz.gr/cart.json");
  let data = await res.json();
  }
  //if (data.cart.proposals.length==0) return null;
  for (let p of data.cart.proposals[0].packages){ tes.push(...p.items)}
  for (let p of tes){
    let skuid=p.sku_id
    let it=Object.values(items).filter(x=>x.sku_id==skuid)[0];
    let key=Object.keys(items).filter(x=>items[x]==it)[0];
    p["id"]=key;
    p["product_id"]=it.product_id;
    p["category_id"]=it.category_id;
  }
  for (let p of tes){
    if (p.product_id==null){
      // KALESE TO JSON TOU PROIONTOS
      let pid= await getProductIdFromProductLink(p.link,p.shop_id);
      p.product_id=pid;
    }
  }
  return tes;
}
var cartsLoaded;

const h1 = document.querySelector("#react-cart-page");
if (typeof button == "undefined") {
  addButton(h1);
  addWeightsButton(h1);
  addLoadButton(h1);
  addSaveButton(h1);
  console.log("hey");
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
    let items = await getItems();
    emptyCart(items);
    console.log("removed!");
  });
}
function addWeightsButton(h1) {
  // Create a new button element
  var button = document.createElement("button");

  // Create an img element
  var img = document.createElement("img");

  // Set the src attribute of the img element to the desired image URL
  //let delurl=chrome.runtime.getURL("./images/delete.png");
  let delurl ="https://img.icons8.com/small/64/weight.png"
  //img.innerHTML=`<img id="icon" src="./images/delete.png">`
  img.src = delurl;
  img.setAttribute("height", "32");
  img.setAttribute("weight", "32");

  // Append the img element to the button element
  button.appendChild(img);
  button.setAttribute("type", "button");
  // Set the onclick attribute of the button element to the desired function
  button.setAttribute("title", "Υπολόγισε τα πρόσθετα βάρη των προϊόντων!");
  button.style.marginLeft = "3em";
  // Select the reference node
  var referenceNode = h1.firstChild;

  // Insert the button element before the reference node
  h1.insertBefore(button, referenceNode);

  button.addEventListener("click", async function () {
    //const element = document.getElementById("some-element");
    if (button.children.length>1) {
      let pop=button.getElementsByClassName("popup")[0];
      pop.remove();
    }
    const loadingIcon = document.createElement("div");
    loadingIcon.classList.add("loading-icon");

    button.appendChild(loadingIcon);
    let copycart=await getItems();
    //console.log(copycart)
    let d = await calculateWeights();
    button.removeChild(loadingIcon);
    if (d.done==false){
      emptyCart(await getItems());
      addItems(copycart);
    }
    const popupElement = document.createElement("div");
    popupElement.classList.add("popup");
    let out=""
    for (let key in d.data){if (d.data[key]['weights'].length==0) continue;
      out+=key+" "+d.data[key]['weights'].join(", ")+"\n";}
    popupElement.innerText = d.text+"\n"+out;

    //const element = document.querySelector("#some-element");
    const rect = button.getBoundingClientRect();

    // Set the position of the popup element
    popupElement.style.left = `${rect.left}px`;
    popupElement.style.top = `${rect.bottom}px`;

    // Add the popup element to the document
    button.appendChild(popupElement);


    setTimeout(()=>{for (let [shop, val] of Object.entries(d.data))
      {
        let txt=val.weights.join(", ")
        // for (let w of val.weights){
        //   txt+=w+" "
        // }
        let a=document.getElementsByTagName("span")
        for (let b of a){if (b.textContent.includes(shop)) b.innerText+="   χρεώνει αντίστοιχα αθροιστικά: "+txt}
      }},"3500");
    //for (let key in d.data){console.log(key,d.data[key]['weights'].join(", "));}
      }
  );
}
function addLoadButton(h1) {
  // Create a new button element
  var button = document.createElement("button");

  // Create an img element
  var img = document.createElement("img");

  // Set the src attribute of the img element to the desired image URL
  //let delurl=chrome.runtime.getURL("./images/delete.png");
  let delurl ="https://img.icons8.com/small/64/opened-folder.png"
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
  // Select the reference node
  var referenceNode = h1.firstChild;
  getCarts(function (carts) {
    cartsLoaded = carts;
  });
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
        for (const cart of cartsLoaded.reverse()) {
          // Create the container element for the cart
          // Add a class to style the container

          // Create the text element for the cart's name
          const cartName = document.createElement("p");
          cartName.textContent = cart.name; // Set the text content to be the cart's name
          cartName.classList.add("cart-name"); // Add a class to style the text element

          // Create the smaller text element for the cart's date
          const cartDate = document.createElement("p");
          cartDate.textContent = cart.date; // Set the text content to be the cart's date
          cartDate.classList.add("cart-date"); // Add a class to style the text element

          // Create the delete icon element
          const deleteButton = document.createElement("button");
          deleteButton.textContent = "Delete"; // Set the text content to be "Load"
          deleteButton.classList.add("delete-savedcart-button"); // Add a class to style the button
          deleteButton.addEventListener("click", function () {
            console.log(cartsLoaded.length);
            cartsLoaded = cartsLoaded.filter((item) => item != cart);
            console.log(cartsLoaded.length);
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
  //let delurl=chrome.runtime.getURL("./images/delete.png");
  let delurl ="https://img.icons8.com/small/64/save.png"
  //img.innerHTML=`<img id="icon" src="./images/delete.png">`
  img.src = delurl;
  img.setAttribute("height", "32");
  img.setAttribute("weight", "32");

  // Append the img element to the button element
  button.appendChild(img);
  button.setAttribute("type", "button");
  // Set the onclick attribute of the button element to the desired function
  button.setAttribute("title", "Αποθήκευσε το καλάθι!");
  button.style.marginLeft = "3em";
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
    let sresp=await saveCart(name);
    console.log(sresp);
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

    // // Remove the text field and "Save" button
    // popup.removeChild(inputField);
    // popup.removeChild(saveButton);
  });
}
async function calculateWeights() {
  let data = {};
  let cart = await reload();
  let proposals = cart.cart.proposals;
  while (proposals.length == 0) {
    cart = await reload();
  }
  let items = cart.cart.line_items;
  let packages = proposals[0].packages;
  let shdata = proposals[0].summary.shipping_data_per_shop;
  for (let p of packages) {
    data[p.shop_info.name] = { weights: [], items: p.items, item_count: 0 };
  }
  emptyCart(items);
  let keys=Object.keys(items);
  for (let i=0 ; i<keys.length; i++) {
    //prosthese
    let tes=[];
    for (let p of cart.cart.proposals[0].packages){ tes.push(...p.items)}
    let tessh=tes.filter(x=>x.sku_id==items[keys[i]].sku_id);
    let headers=null;
    if (tessh.length==1){
    console.log(tessh.link);
    headers={'origin': "https://www.skroutz.gr",
    'content-type': 'application/json',
    'authority': 'www.skroutz.gr',  
    'referer': tessh.link
  }}
    let kala=await addtoCart(items[keys[i]], headers);
    //let kala = await reload();
    //reload();
    let count=0
    let ksana=true
    while (ksana==true) {
      kala = await reload();
      count++
      if (count==4) return {text:"Kάτι πήγε στραβά. Ξαναδοκιμάστε.", data: data, done:false };
      if (kala.cart.proposals.length == 0) continue;
    //kwdikos=r['item'];
    let proposals = kala["cart"]["proposals"][0];
    let shops = proposals["summary"]["shipping_data_per_shop"];
    // let shop = proposals['summary']['shipping_data_per_shop'][shops-1];
    let paketa=[];
    for (let p of proposals.packages){
      let shname=p.shop_info.name;
      let pitems=p.items;
      let sitems;
      try{
      sitems=data[shname]['items']
      }
      catch{
        let errtext=(`Μπέρδεμα με το όνομα του μαγαζιού: ${shname}`);
        console.log(errtext);
        i--;
        continue;
        //return {text: errtext, data: data, done: false};
      }
      if (pitems.length==data[shname]["weights"].length) {
        paketa.push(true)
        continue;}
      if(pitems.every(x=>{
        return sitems.some(y=>y.sku_id==x.sku_id && y.quantity==x.quantity)
      })){
        let sh=shops.filter(x=>x.name==shname);
        if (sh.length>0){
        data[shname]["weights"].push(sh[0]["weight"]);
        data[shname]["item_count"]++;}
      }
      else{
        ksana=true
        count++
      }
      }
      //sinthiki an exoun ola ta paketa isa items
      if (paketa.every(x=>x)) ksana=false
    }
      // pitems.every
    }
    // for (let i = 0; i < shops.length; i++) {
    //   if (shops[i].item_count > data[shops[i].name]["item_count"]) {
    //     data[shops[i].name]["weights"].push(shops[i]["weight"]);
    //     data[shops[i].name]["item_count"]++;
    //   }
    // }

    //console.log(shop);
    //console.log(`To ${items[key]['sku_id']} mono tou xrewnetai me varos ${shop['weight']}`);
    //ypologise
    //diegrapse
  
  return {text:"Ολοκληρώθηκε", data: data, done:true};
}
function addItems(items) {
  for (let i of items){
    addtoCart(i)
  }
}
async function saveCart(name = "") {
  let c = await getItems();
  if (Object.entries(c).length==0) {
    console.log("no items");
    return false;
  }
  else{
  let d = new Date();
  if (name == "") {
    name = d.toLocaleString();
  }
  let cartObj = { date: d.toLocaleString(), cart: c, name: name };

      cartsLoaded.push(cartObj); // Add the new cart object to the array

    // Save the updated Carts array to chrome.storage.sync
    chrome.storage.sync.set({ Carts: cartsLoaded }, function () {
      console.log("Cart saved to chrome.storage.sync");
    });
    return true;
  }
}

function getCarts(callback) {
  chrome.storage.sync.get("Carts", function (items) {
    let carts = items.Carts || []; // Set to an empty array if it doesn't exist
    callback(carts); // Call the callback function with the Carts array as the argument
  });
}

/* let h1;
if (typeof(h1)=="undefined"){
  h1=document.querySelector("#react-cart-page");}
if (typeof(button)=="undefined") {addButton(h1)}
//var h1 = document.querySelector('.page-title');
// Create a new button element
*/
