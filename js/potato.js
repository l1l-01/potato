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
  SUM: "FUNCTION",
  AVG: "FUNCTION",
  COUNT: "FUNCTION",
};

const OPERATORS = {
  "!": "OPERATOR",
  ">=": "OPERATOR",
  "<=": "OPERATOR",
  ">": "OPERATOR",
  "<": "OPERATOR",
};

const ERROR_TYPES = {
  EMPTY_QUERY: "ERROR(000): Your query is empty.",
  UNKOWN_KEYWORD: "ERROR(001): UNKNOWN KEYWORD: ",
  CRUD_KEYWORD:
    "Error(002): Missing CRUD keyword. An action must be specified. Use one of: LET, GET, UPD, DLT.",
  CRUD_OPERATIONS:
    "Error(003): Only one CRUD operation can run at a time. You are trying to use more than one: ",
  CRUD_KEYWORD_MISPLACED: "ERROR(004): Misplaced CRUD keyword: ",
  CRUD_MULTIPLE_TABLES:
    "ERROR(005): You can only perform one CRUD operation on a single table at a time: ",
  MISSING_TABLE: "ERROR(006): Your query is missing a table name.",
  MISPLACED_TABLE_NAME: "ERROR(007): Misplaced table name: ",
  MISSING_CRUD_OPERATION:
    "ERROR(008): Missing operation. Please use one of: LET, GET, UPD, DLT.",
  ID_NOT_NEEDED:
    "ERROR(009): ID is created automatically, remove the provided id: ",
  LIMIT_UNUSABLE: "ERROR(010): Limit can only be used in a GET query: ",
  OPERATOR_UNUSABLE: "ERROR(011): Operators can only be used in a GET query: ",
  FUNCTION_UNUSABLE: "ERROR(012): Functions can only be used in a GET query: ",
  MISSING_FIELD_DATATYPE:
    "ERROR(013): Fields and their types are required to create a table.",
  MISSING_FIELD: "ERROR(014): Missing field(s).",
  MISSING_DATATYPE: "ERROR(015): Missing datatype(s).",
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

        for (let key in FUNCTIONS) {
          if (word.includes(key)) {
            type = FUNCTIONS[key];
            word = word;
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

  /*console.log(tokens);*/
  return tokens;
}

export function parser(VALUE) {
  let error = "";
  let errors = [];

  // Catch empty query
  if (VALUE.trim() == "") {
    errors.push(ERROR_TYPES.EMPTY_QUERY);
  }

  const TOKENS = lexer(VALUE);

  let fields = [];
  let ids = [];
  let limits = [];
  let values = [];
  let keywords = [];
  let datatypes = [];
  let operators = [];
  let functions = [];

  const atsNode = {
    action: "",
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
    error = `${ERROR_TYPES.CRUD_MULTIPLE_TABLES} ${tables}`;
    errors.push(error);
  }

  if (errors.length > 0) {
    console.log(errors);
    return errors;
  }

  // Collect language elements into typed arrays for validation
  TOKENS.forEach((token, i) => {
    let wordPosition = i + 1;
    switch (token.type) {
      case "TABLE":
        // Catching a misplaced table
        if (TOKENS[i - 1]?.type != "ACTION") {
          error = `${ERROR_TYPES.MISPLACED_TABLE_NAME} at position ${wordPosition}.`;
          errors.push(error);
        }
        atsNode.table = token.value;
        break;

      case "FIELD":
        fields.push({
          type: token.type,
          value: token.value,
          position: wordPosition,
        });
        break;

      case "VALUE":
        values.push({
          type: token.type,
          value: token.value,
          position: wordPosition,
        });
        break;

      case "IDENTIFICATION":
        ids.push({
          type: token.type,
          value: token.value,
          position: wordPosition,
        });
        break;

      case "LIMITAION":
        limits.push({
          type: token.type,
          value: token.value,
          position: wordPosition,
        });
        break;

      case "ACTION":
        // Catching a misplaced CURD keyword
        if (i != 0) {
          error = `${ERROR_TYPES.CRUD_KEYWORD_MISPLACED} ${token.value} at position ${wordPosition}, CRUD keyword must be the first word in the query."`;
          errors.push(error);
        } else {
          atsNode.action = token.value;
        }
        break;

      case "KEYWORD":
        for (let keyword in KEYWORDS) {
          if (keyword == token.value) {
            keywords.push({
              type: token.type,
              value: token.value,
              position: wordPosition,
            });
          }
        }
        break;

      case "DATATYPE":
        for (let keyword in DATATYPES) {
          if (keyword == token.value) {
            datatypes.push({
              type: token.type,
              value: token.value,
              position: wordPosition,
            });
          }
        }
        break;

      case "OPERATOR":
        for (let keyword in OPERATORS) {
          if (keyword == token.value) {
            operators.push({
              type: token.type,
              value: token.value,
              position: wordPosition,
            });
          }
        }
        break;

      case "FUNCTION":
        for (let keyword in FUNCTIONS) {
          if (keyword == token.value) {
            functions.push({
              type: token.type,
              value: token.value,
              position: wordPosition,
            });
          }
        }
        break;

      default:
        error = `${ERROR_TYPES.UNKOWN_KEYWORD} ${token.value} at postition ${wordPosition}`;
        errors.push(error);
        break;
    }
  });

  if (errors.length > 0) {
    console.log(errors);
    return errors;
  }

  const IDS_LENGTH = ids.length;
  const LIMITS_LENGTH = limits.length;
  const OPERATORS_LENGTH = operators.length;
  const KEYWORDS_LENGTH = keywords.length;
  const FUNCTIONS_LENGTH = functions.length;
  const DATATYPES_LENGTH = datatypes.length;
  const VALUE_LENGTH = values.length;
  const FIELDS_LENGTH = fields.length;

  switch (atsNode.action) {
    case "LET":
      // Catching when ID is created manually
      if (IDS_LENGTH !== 0) {
        let idsInfo = "";
        ids.forEach((id, i) => {
          idsInfo += `#${id.value} at position ${id.position}${IDS_LENGTH == i + 1 ? ", " : "."}`;
        });
        error = `${ERROR_TYPES.ID_NOT_NEEDED} ${idsInfo}`;
        errors.push(error);
      }

      // Catching when limit is used on a LET query
      if (LIMITS_LENGTH !== 0) {
        let limitsInfo = "";
        limits.forEach((limit, i) => {
          limitsInfo += `@${limit.value} at position ${limit.position}${LIMITS_LENGTH == i + 1 ? "." : ","}`;
        });
        error = `${ERROR_TYPES.LIMIT_UNUSABLE} ${limitsInfo}`;
        errors.push(error);
      }

      // Catching when operators is used on a LET query
      if (OPERATORS_LENGTH !== 0) {
        let operatorsInfo = "";
        operators.forEach((operator, i) => {
          operatorsInfo += `${operator.value} at position ${operator.position}${OPERATORS_LENGTH == i + 1 ? "." : ","}`;
        });
        error = `${ERROR_TYPES.OPERATOR_UNUSABLE} ${operatorsInfo}`;
        errors.push(error);
      }

      // Catching when functions is used on a LET query
      if (FUNCTIONS_LENGTH != 0) {
        let funcsInfo = "";
        functions.forEach((func, i) => {
          funcsInfo += `${func.value} at position ${func.position}${FUNCTIONS_LENGTH == i + 1 ? "." : ","}`;
        });
        error = `${ERROR_TYPES.FUNCTION_UNUSABLE} ${funcsInfo}`;
        errors.push(error);
      }

      // Catching when DATATYPES_LENGTH is different than FIELDS_LENGTH in a LET query
      if (DATATYPES_LENGTH == FIELDS_LENGTH) {
        // Creating columns
        fields.forEach((field, i) => {
          const target = values.filter(
            (value) => value?.position === field?.position + 2,
          );
          atsNode.column.push({
            name: field.value,
            datatype: datatypes[i]?.value,
            value: target[0]?.value,
          });
        });
        console.log(atsNode);
      } else if (DATATYPES_LENGTH > FIELDS_LENGTH) {
        errors.push(ERROR_TYPES.MISSING_FIELD);
      } else if (DATATYPES_LENGTH < FIELDS_LENGTH) {
        errors.push(ERROR_TYPES.MISSING_DATATYPE);
      } else if (DATATYPES_LENGTH == 0 && FIELDS_LENGTH == 0) {
        errors.push(ERROR_TYPES.MISSING_FIELD_DATATYPE);
      }

      console.log(errors);

      break;

    case "GET":
      break;

    case "UPD":
      break;

    case "DLT":
      break;

    case "DROP":
      break;

    default:
      errors.push(ERROR_TYPES.MISSING_CRUD_OPERATION);
      return errors;
      break;
  }

  console.log(fields, values);

  //console.log(atsNode, errors, fields);
}
