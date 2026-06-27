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

BTN.addEventListener("click", async () => {
  let VALUE = INPUT.value;
  const res = await potato(VALUE);

  console.log("response: ", res);

  if (!res || !res.action) {
    console.log("Data is null");
    return;
  }
  if (res.success) {
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
        TABLE_NAME.innerText = "Field";
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
        const DATATYPE_TD = createEle("td");
        DATATYPE_TD.innerText = "Datatype";
        TD_TR.appendChild(DATATYPE_TD);

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
        break;
      }

      case "GET": {
        const span = createEle("span");
        span.innerText = res.msg;
        addClass(span, "success");
        PARENT.appendChild(span);

        const TABLE = createEle("table");
        PARENT.appendChild(TABLE);

        const TH_TR = createEle("tr");
        TABLE.appendChild(TH_TR);

        const ID = createEle("th");
        ID.innerText = "Id";
        TH_TR.appendChild(ID);

        const DATA = res?.data;
        DATA[0].data.forEach((d) => {
          const TH = createEle("th");
          TH.innerText = d.name;
          TH_TR.appendChild(TH);
        });

        DATA.forEach((d) => {
          console.log(d);
          const TB_TR = createEle("tr");
          TABLE.appendChild(TB_TR);

          const ID = createEle("td");
          ID.innerText = d.id;
          TB_TR.appendChild(ID);

          d.data.forEach((b) => {
            const TD = createEle("td");
            TD.innerText = b.value;
            TB_TR.appendChild(TD);
          });
        });
        break;
      }

      case "DLT": {
        const span = createEle("span");
        span.innerText = res.msg;
        addClass(span, "success");
        PARENT.appendChild(span);
      }

      default:
        console.log("Data is null");
        break;
    }
  } else {
    res.errors.forEach((err) => {
      const span = createEle("span");
      span.innerText = err;
      addClass(span, "error");
      PARENT.appendChild(span);
    });
  }
});
