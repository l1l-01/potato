import { lexer } from "./potato.js";

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
  lexer(VALUE);
});
/*
if (INPUT.value.includes(";")) {
  for (let key in TOKENS) {
    if (value.includes(TOKENS[key])) {
      instruction += TOKENS[key];
      console.log(instruction);
    }
  }
} else {
  value = input.value;
  console.log("Still");
}
  */
