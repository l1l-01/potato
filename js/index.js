import { executor as potato } from "./potato.js";

function getById(id) {
  return document.getElementById(id);
}

function addClass(ele, cssClass) {
  ele.classList.add(cssClass);
}

const INPUT = getById("in");
const BTN = getById("btn");
const PARENT = getById("parent");
console.log(PARENT);

BTN.addEventListener("click", () => {
  let VALUE = INPUT.value;
  const res = potato(VALUE);

  console.log("response: ", res);

  if (!res || !res.action) {
    console.log("Data is null");
    return;
  }

  switch (res.action) {
    case "LET":
      const span = document.createElement("span");
      span.innerText = res.msg;
      addClass(span, "success");
      PARENT.appendChild(span);
      console.log(span);
      break;

    default:
      console.log("Data is null");
      break;
  }
});
