import { potato } from "./potato.js";

function getById(id) {
  return document.querySelector(id);
}

function addEvent(EventTarget, event, func) {
  return EventTarget.addEventListener(event, func);
}

const INPUT = getById("#in");
const BTN = getById("#btn");

addEvent(BTN, "click", () => {
  let VALUE = INPUT.value;
  potato(VALUE);
});
