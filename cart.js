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


var h1 = document.querySelector('.page-title');
// Create a new button element
var button = document.createElement('button');

// Create an img element
var img = document.createElement('img');

// Set the src attribute of the img element to the desired image URL
delurl='https://cdn.iconscout.com/icon/premium/png-256-thumb/delete-cart-1601732-1357634.png';
img.setAttribute('src', delurl);
img.setAttribute('height', "32");
img.setAttribute('weight',"32");
// Append the img element to the button element
button.appendChild(img);
button.setAttribute('type', 'button');
// Set the onclick attribute of the button element to the desired function
button.setAttribute('title', 'Άδεισμα ολόκληρου καλαθιού!');

// Append the button element to the h1 element
h1.appendChild(button);

button.addEventListener('click',async function() {
    let items=await getItems();
    emptyCart(items);
    console.log("removed!");
});
