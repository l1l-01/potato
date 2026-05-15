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
  CRUD_MULTIPLE_TABLES:
    "ERROR(003): You can only perform one CRUD operation on a single table at a time: ",
  MISSING_TABLE: "ERROR(004): Your query is missing a table name.",
  MISPLACED_TABLE_NAME: "ERROR(004): Misplaced table name: ",
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
  let error = "";
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
  const ACTIONS =
    TOKENS.filter(
      (token) =>
        token.value == "LET" ||
        token.value == "GET" ||
        token.value == "UPD" ||
        token.value == "DLT" ||
        token.value == "DROP",
    ) || null;

  const ACTIONS_LENGTH = ACTIONS.length;

  if (ACTIONS_LENGTH == 0) {
    errors.push(ERROR_TYPES.CRUD_KEYWORD);
  } else if (ACTIONS_LENGTH >= 2) {
    let operations = "";
    ACTIONS.forEach((action, i) => {
      operations += `${action.value} at position ${action.position}${ACTIONS_LENGTH == i + 1 ? "." : ", "}`;
    });
    error = ERROR_TYPES.CRUD_OPERATIONS + operations;
    errors.push(error);
  }

  //* Catching a CRUD operation on more than one table && Missing table name
  const TABLES = TOKENS.filter((token) => token.type == "TABLE");
  const TABLES_LENGTH = TABLES.length;

  if (TABLES_LENGTH == 0) {
    errors.push(ERROR_TYPES.MISSING_TABLE);
  } else if (TABLES_LENGTH > 1) {
    let tables = "";
    TABLES.forEach((action, i) => {
      tables += `${action.value} at position ${action.position}${ACTIONS_LENGTH == i + 1 ? ", " : "."}`;
    });
    error = `${ERROR_TYPES.CRUD_MULTIPLE_TABLES}` + tables;
    errors.push(error);
  }

  if (errors.length > 0) {
    console.log(errors);
    return errors;
  }

  TOKENS.forEach((token, i) => {
    if (token.type != "TABLE") {
      switch (token.type) {
        case "FIELD":
          console.log("Field: ", token.value, token.type, i);
          fields.push([token.value, token.position]);
          break;
        case "VALUE":
          console.log("value: ", token.value, token.type, i);
          values.push([token.value, token.position]);
          break;
        case "IDENTIFICATION":
          console.log("Id: ", token.value, token.type, i);
          break;
        case "LIMITAION":
          console.log("Limit: ", token.value, token.type, i);
          break;

        default:
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
          break;
      }
    } else {
      // Catching a misplaced table
      if (TOKENS[i - 1].type != "ACTION") {
        error = `${ERROR_TYPES.MISPLACED_TABLE_NAME} at position ${token.position}.`;
        errors.push(error);
      }
      console.log("TABLE", token.type, token.value, i);
    }
  });

  if (errors.length > 0) {
    console.log(errors);
    return errors;
  }

  /*
  const error = `Error: The OPERATOR ${token.value} was written wrong at the position ${token.position}, It should be writen like ${keyword}`;
  errors.push(error);

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
  */
  //console.log(atsNode, errors, fields);
}
