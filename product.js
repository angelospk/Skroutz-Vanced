// l=Array.from(document.getElementsByTagName("ul"))
// l=l.filter(x=>x.className.includes("featured"))
// for (let lista of l) lista.style.display="none"

let a=document.querySelector(".js-prices").getElementsByTagName("ul")
if (a.length>0) a[0].style.display="none";