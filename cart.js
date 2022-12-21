async function reload(){
    let res=await fetch("https://www.skroutz.gr/cart.json");
    let data=await res.json();
    //let obj=processJsonData(data);
    return data
  };
  async function deleteItem(id){
    fetch(
        `https://www.skroutz.gr/cart/remove_line_item/ddd.json`.replace('ddd', id),
        { method: 'POST' }
      );
  }
  function emptyCart(items){
    for (let key in items){
        deleteItem(key);
    }
  }
  async function getItems(){
    let res=await fetch("https://www.skroutz.gr/cart/line_items.json");
    let data=await res.json();
    items=data['cart']['line_items'];
    return items
  }
  const h1=document.querySelector("#react-cart-page");
  if (typeof(button)=="undefined") {
    addButton(h1);
    console.log("hey");
  }
  function addButton(h1) {
    // Create a new button element
    var button = document.createElement('button');
  
    // Create an img element
    var img = document.createElement('img');
  
    // Set the src attribute of the img element to the desired image URL
    //let delurl=chrome.runtime.getURL("./images/delete.png");
    let delurl="https://fileswin.com/wp-content/uploads/2017/11/PC-Decrapifier-Logo.png";
    //img.innerHTML=`<img id="icon" src="./images/delete.png">`
    img.src=delurl;
    img.setAttribute('height', "32");
    img.setAttribute('weight',"32");
  
    // Append the img element to the button element
    button.appendChild(img);
    button.setAttribute('type', 'button');
    // Set the onclick attribute of the button element to the desired function
    button.setAttribute('title', 'Άδεισμα ολόκληρου καλαθιού!');
    button.style.marginLeft="25em";
    // Select the reference node
    var referenceNode = h1.firstChild;
  
    // Insert the button element before the reference node
    h1.insertBefore(button, referenceNode);
  
    button.addEventListener('click', async function() {
      let items = await getItems();
      emptyCart(items);
      console.log("removed!");
    });
  }
  
chrome.reload();
 /* let h1;
if (typeof(h1)=="undefined"){
  h1=document.querySelector("#react-cart-page");}
if (typeof(button)=="undefined") {addButton(h1)}
//var h1 = document.querySelector('.page-title');
// Create a new button element
*/