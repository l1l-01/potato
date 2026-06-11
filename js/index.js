import { executor as potato } from "./potato.js";

function getById(id) {
  return document.getElementById(id);
}

function addClass(ele, cssClass) {
  ele.classList.add(cssClass);
}

function createEle(ele) {
  return document.createElement(ele);
}

const INPUT = getById("in");
const BTN = getById("btn");
const PARENT = getById("parent");

BTN.addEventListener("click", () => {
  let VALUE = INPUT.value;
  const res = potato(VALUE);

  console.log("response: ", res);

  if (!res || !res.action) {
    console.log("Data is null");
    return;
  }

  switch (res.action) {
    case "LET": {
      const span = createEle("span");
      span.innerText = res.msg;
      addClass(span, "success");
      PARENT.appendChild(span);

      const TABLE = createEle("table");
      PARENT.appendChild(TABLE);

      const TH_TR = createEle("tr");
      TABLE.appendChild(TH_TR);

      const TABLE_NAME = createEle("th");
      TABLE_NAME.innerText = res.table;
      TH_TR.appendChild(TABLE_NAME);

      let fields = [];
      let datatypes = [];

      res?.data?.forEach((col) => {
        const TH = createEle("th");
        TH.innerText = col.name;
        fields.push(TH);

        const TD = createEle("td");
        TD.innerText = col.datatype;
        datatypes.push(TD);
      });

      fields.forEach((field) => {
        TH_TR.appendChild(field);
      });

      const TD_TR = createEle("tr");
      TABLE.appendChild(TD_TR);
      const EMPTY_TD = createEle("td");
      TD_TR.appendChild(EMPTY_TD);

      datatypes.forEach((type) => {
        TD_TR.appendChild(type);
      });
      break;
    }

    case "POST": {
      const span = createEle("span");
      span.innerText = res.msg;
      addClass(span, "success");
      PARENT.appendChild(span);

      const TABLE = createEle("table");
      PARENT.appendChild(TABLE);

      const TH_TR = createEle("tr");
      TABLE.appendChild(TH_TR);

      const TB_TR = createEle("tr");
      TABLE.appendChild(TB_TR);

      const DATA = res?.data;

      DATA.forEach((d) => {
        const TD = createEle("th");
        TD.innerText = d.name;
        TH_TR.appendChild(TD);
      });

      DATA.forEach((d) => {
        const TD = createEle("td");
        TD.innerText = d.value;
        TB_TR.appendChild(TD);
      });

      break;
    }

    case "DROP": {
      const span = createEle("span");
      span.innerText = res.msg;
      addClass(span, "success");
      PARENT.appendChild(span);
    }

    default:
      console.log("Data is null");
      break;
  }
});
