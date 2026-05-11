const KEYWORDS = {
  ASEC: "KEYWORD",
  DESC: "KEYWORD",
  ALL: "KEYWORD",
  AND: "KEYWORD",
  OR: "KEYWORD",
  WHERE: "KEYWORD",
  BETWEEN: "KEYWORD",
};

const ACTIONS = {
  LET: "ACTION",
  GET: "ACTION",
  UPD: "ACTION",
  DLT: "ACTION",
  PUT: "ACTION",
  DROP: "ACTION",
};

const DATATYPES = {
  STR: "DATATYPE",
  INT: "DATATYPE",
  DEC: "DATATYPE",
  BOOL: "DATATYPE",
  DATE: "DATATYPE",
  ENUM: "DATATYPE",
};

const PREFIXES = {
  ":": "VALUE",
  "@": "LIMITAION",
  "#": "IDENTIFICATION",
  $: "FIELD",
};

const FUNCTIONS = {
  SUM: "KEYWORD",
  AVG: "KEYWORD",
  COUNT: "KEYWORD",
};

const OPERATORS = {
  "!": "OPERATOR",
  ">=": "OPERATOR",
  "<=": "OPERATOR",
  ">": "OPERATOR",
  "<": "OPERATOR",
};

const ERROR_TYPES = {
  CRUD_KEYWORD:
    "Error(001): Missing CRUD keyword. An action must be specified. Use one of: LET, GET, UPD, DLT.",
  CRUD_OPERATIONS:
    "Error(002): Only one CRUD operation can run at a time. You are trying to use more than one: ",
  CRUD_KEYWORD_MISPLACED: "ERROR(003): Misplaced CRUD keyword: ",
};

function lexer(VALUE) {
  let tokens = [];
  let type = null;
  const MAIN_RE = new RegExp(
    `\\b(${Object.keys(KEYWORDS).join("|")})\\b`,
    "gi",
  );
  const SUB_RE = new RegExp(`\\${Object.keys(OPERATORS).join("|")}\\i`, "gi");

  // * Split user input into an array on whitespace
  const WORDS = VALUE.split(/(\s+)/);

  //* Create tokens: for each word in the words array, record type, value, and position
  WORDS.forEach((word, i) => {
    word = word.trim();
    if (!MAIN_RE.test(word)) {
      if (word) {
        type = word.replace(SUB_RE, function (matched) {
          return OPERATORS[matched];
        });

        for (let key in PREFIXES) {
          if (word.includes(key)) {
            type = PREFIXES[key];
            word = word.replace(key, "");
          }
        }

        for (let key in ACTIONS) {
          if (word.includes(key)) {
            type = ACTIONS[key];
            word = word;
          }
        }

        for (let key in DATATYPES) {
          if (word.includes(key)) {
            type = DATATYPES[key];
            word = key;
          }
        }

        if (type != type.toUpperCase()) {
          tokens.push({ type: "TABLE", value: word, position: i });
        } else {
          tokens.push({ type: type, value: word, position: i });
        }
      }
    } else {
      type = word.replace(MAIN_RE, function (matched) {
        return KEYWORDS[matched];
      });
      tokens.push({ type: type, value: word, position: i });
    }
  });

  console.log(tokens);

  return tokens;
}

export function parser(VALUE) {
  const TOKENS = lexer(VALUE);
  let errors = [];
  let fields = [];
  let values = [];
  const atsNode = {
    action: "",
    type: "",
    table: "",
    column: [],
  };

  //* Catch missing CRUD operator && Detect multiple CRUD operations used simultaneously
  const actions =
    TOKENS.filter(
      (token) =>
        token.value == "LET" ||
        token.value == "GET" ||
        token.value == "UPD" ||
        token.value == "DLT" ||
        token.value == "DROP",
    ) || null;

  const ACTIONS_LENGTH = actions.length;

  if (ACTIONS_LENGTH == 0) {
    errors.push(ERROR_TYPES.CRUD_KEYWORD);
    return errors;
  } else if (ACTIONS_LENGTH >= 2) {
    let operations = "";
    actions.forEach((action, i) => {
      operations += `${action.value} at position ${action.position}${ACTIONS_LENGTH == i + 1 ? "." : ", "}`;
    });
    const ERROR = ERROR_TYPES.CRUD_OPERATIONS + operations;
    errors.push(ERROR);
    return errors;
  }

  TOKENS.forEach((token, i) => {
    if (token.type != "TABLE") {
      for (let keyword in KEYWORDS) {
        if (token.type == "KEYWORD" && keyword == token.value) {
          console.log("Keyword: ", keyword, token.type, i);
        }
      }

      for (let keyword in DATATYPES) {
        if (token.type == "DATATYPE" && keyword == token.value) {
          console.log("Datatype", keyword, token.type, i);
        }
      }

      for (let keyword in OPERATORS) {
        if (token.type == "OPERATOR" && keyword == token.value) {
          console.log("Operator", keyword, token.type, i);
        }
      }
    } else {
      //* Get table name and fields names
      const TOKEN_VALUE = TOKENS[i - 1]?.value;
      if (TOKEN_VALUE != undefined) {
        if (
          TOKEN_VALUE == "LET" ||
          TOKEN_VALUE == "GET" ||
          TOKEN_VALUE == "UPD" ||
          TOKEN_VALUE == "DLT" ||
          TOKEN_VALUE == "DROP"
        ) {
          console.log("Table Name: ", token.value, i);
          atsNode.table = token.value;
        } else {
          fields.push({ field: token.value, filed_position: token.position });
        }
      } else {
        const ERROR = `${ERROR_TYPES.CRUD_KEYWORD_MISPLACED} ${actions[0].value} at position ${actions[0].position}.`;
        errors.push(ERROR);
      }
      console.log("TABLE", token.type, token.value, i);
    }
  });

  /*
  const error = `Error: The OPERATOR ${token.value} was written wrong at the position ${token.position}, It should be writen like ${keyword}`;
  errors.push(error);
  */
  console.log(atsNode, errors, fields);
}
