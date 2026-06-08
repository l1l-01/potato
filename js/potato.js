const KEYWORDS = {
  DESC: "KEYWORD",
  AND: "KEYWORD",
  OR: "KEYWORD",
  WHERE: "KEYWORD",
  ",": "KEYWORD",
};

const ACTIONS = {
  LET: "ACTION",
  POST: "ACTION",
  GET: "ACTION",
  UPD: "ACTION",
  DLT: "ACTION",
  DROP: "ACTION",
};

const DATATYPES = {
  STR: "DATATYPE",
  INT: "DATATYPE",
  FLT: "DATATYPE",
  BOOL: "DATATYPE",
  DATE: "DATATYPE",
};

const PREFIXES = {
  ":": "VALUE",
  "@": "LIMITAION",
  "#": "IDENTIFICATION",
  $: "FIELD",
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
    "Error(002): Missing CRUD keyword. An action must be specified. Use one of: LET, POST, GET, UPD, DLT.",
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
  OPERATOR_UNUSABLE:
    "ERROR(011): Operators can only be used in a GET and UPD queries: ",
  KEYWORD_UNUSABLE:
    "ERROR(012): Keywords can only be used in a GET and UPD queries: ",
  MISSING_FIELD_DATATYPE:
    "ERROR(013): Fields and their types are required to create a table.",
  MISSING_FIELD_VALUE:
    "ERROR(014): Fields and their values are required to create a table.",
  MISSING_FIELD: "ERROR(015): Missing field(s).",
  MISSING_DATATYPE: "ERROR(016): Missing datatype(s).",
  MISSING_VALUE: "ERROR(017): Missing value(s).",
  MISPLACED_DATATYPE: "ERROR(018): Datatype must appear after its field: ",
  MISPLACED_VALUE:
    "ERROR(019): Value must appear after its field, its field's datatype, or an operator: ",
  DATATYPES_NOT_ALLOWED: "ERROR(020): Datatype(s) not allowed: ",
  REPEATED_WHERE: "ERROR(021): You can only use one WHERE keyword: ",
  UNDEFINED_AND_STATE:
    "ERROR(022): You can't use the AND keyword at the end of the query, ",
  NOT_ALLOWED_AFTER_AND:
    "ERROR(023): You are only allowed to use id (#1), field ($field) and value (:value) after the keyword AND: ",
  NOT_ALLOWED_AFTER_SCOPE:
    "ERROR(024): You are only allowed to use AND or OR or BETWEEN after the keyword ',': ",
  ID_CANNOT_UPDATE: "ERROR(024): You are not allowed to update the ID ",
  FIELD_NOT_ALLOWED:
    "ERROR(025): You are only allwoed to use fields in LET, GET, UPD and DLT queries: ",
  ID_CAN_NOT_USED: "ERROR(026): You are not allwoed to use ids in DROP query: ",
  DUPLICATED_DESC: "ERROR(027): Duplicated DESC: ",
  OPENING_DB: "ERROR(028): Can't open database: ",
  FAILED_DB: "ERROR(028): Database failed to open: ",
  MISSING_METADATA: "ERROR(029): Missing meta deta from table: ",
  TABLE_EXISTS:
    "ERROR(030): You can only create one table at a time; please delete the current table before creating a new one: ",
};

let errors = [];

function lexer(VALUE) {
  if (VALUE.trim() == "") {
    errors.push(ERROR_TYPES.EMPTY_QUERY);
    return null;
  }

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

        if (type !== type.toUpperCase()) {
          tokens.push({ type: "TABLE", value: word, position: i });
        } else {
          if (word === ",") {
            tokens.push({ type: "KEYWORD", value: ",", position: i });
          } else {
            tokens.push({ type: type, value: word, position: i });
          }
        }
      }
    } else {
      type = word.replace(MAIN_RE, function (matched) {
        return KEYWORDS[matched];
      });
      tokens.push({ type: type, value: word, position: i });
    }
  });

  return tokens;
}

function parser(VALUE) {
  // Catch empty query
  const TOKENS = lexer(VALUE);

  if (TOKENS === null) return null;

  let fields = [];
  let ids = [];
  let limits = [];
  let values = [];
  let keywords = [];
  let datatypes = [];
  let operators = [];

  const AST = {
    action: "",
    table: "",
    columns: [],
    fields: [],
    condition: [],
    isCondition: false,
    all: true,
    limit: undefined,
    order: undefined,
  };

  // Catch missing CRUD operator && Detect multiple CRUD operations used simultaneously
  const ACTIONS =
    TOKENS.filter(
      (token) =>
        token.value == "LET" ||
        token.value == "POST" ||
        token.value == "GET" ||
        token.value == "UPD" ||
        token.value == "DLT" ||
        token.value == "DROP",
    ) || null;

  const ACTIONS_LENGTH = ACTIONS.length;

  if (ACTIONS_LENGTH === 0) {
    errors.push(ERROR_TYPES.CRUD_KEYWORD);
  } else if (ACTIONS_LENGTH >= 2) {
    let operations = "";
    ACTIONS.forEach((action, i) => {
      operations += `${action.value} at position ${action.position}${ACTIONS_LENGTH == i + 1 ? "." : ", "}`;
    });
    const error = ERROR_TYPES.CRUD_OPERATIONS + operations;
    errors.push(error);
  }

  // Catching a CRUD operation on more than one table && Missing table name
  const TABLES = TOKENS.filter((token) => token.type == "TABLE");
  const TABLES_LENGTH = TABLES.length;

  if (TABLES_LENGTH > 1) {
    let tables = "";
    TABLES.forEach((action, i) => {
      tables += `${action.value} at position ${action.position}${ACTIONS_LENGTH == i + 1 ? ", " : "."}`;
    });
    const error = `${ERROR_TYPES.CRUD_MULTIPLE_TABLES} ${tables}`;
    errors.push(error);
  }

  // Collect language elements into typed arrays for validation
  TOKENS.forEach((token, i) => {
    const wordPosition = i + 1;
    switch (token.type) {
      case "TABLE":
        // Catching a misplaced table
        if (TOKENS[i - 1]?.type !== "ACTION") {
          const error = `${ERROR_TYPES.MISPLACED_TABLE_NAME} at position ${wordPosition}.`;
          errors.push(error);
        }
        AST.table = token.value;
        break;

      case "FIELD":
        fields.push({
          type: token.type,
          value: token.value,
          position: wordPosition,
        });
        break;

      case "VALUE":
        // Catching a misplaced CURD value
        const beforeValue = TOKENS[i - 1].type;
        if (
          beforeValue !== "FIELD" &&
          beforeValue !== "DATATYPE" &&
          beforeValue !== "OPERATOR"
        ) {
          const error = `${ERROR_TYPES.MISPLACED_VALUE} ${token.value} at position ${wordPosition}.`;
          errors.push(error);
        }

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
        if (i !== 0) {
          const error = `${ERROR_TYPES.CRUD_KEYWORD_MISPLACED} ${token.value} at position ${wordPosition}, CRUD keyword must be the first word in the query.`;
          errors.push(error);
        } else {
          AST.action = token.value;
        }
        break;

      case "KEYWORD":
        // Catch when a query ends with the AND keyword and when invalid element types follow AND
        const nextToken = TOKENS[i + 1];
        if (token.value === "AND") {
          if (nextToken?.value === undefined) {
            const error = `${ERROR_TYPES.UNDEFINED_AND_STATE} at position ${token.position}.`;
            errors.push(error);
          } else if (
            nextToken?.type !== "IDENTIFICATION" &&
            nextToken?.type !== "FIELD" &&
            nextToken?.type !== "VALUE"
          ) {
            const error = `${ERROR_TYPES.NOT_ALLOWED_AFTER_AND} ${nextToken.value} at position ${nextToken.position}.`;
            errors.push(error);
          }
        } else if (token.value === ",") {
          // Catch when a query ends with the AND keyword and when invalid element types follow AND
          if (
            nextToken?.value !== "OR" &&
            nextToken?.value !== "AND" &&
            nextToken?.value !== "BETWEEN"
          ) {
            const error = `${ERROR_TYPES.NOT_ALLOWED_AFTER_SCOPE} ${nextToken.value} at position ${nextToken.position}.`;
            errors.push(error);
          }
        }

        for (let keyword in KEYWORDS) {
          if (keyword === token.value) {
            keywords.push({
              type: token.type,
              value: token.value,
              position: wordPosition,
            });
          }
        }
        break;

      case "DATATYPE":
        // Catching when a datatype is not posisioned after a field
        if (TOKENS[i - 1].type !== "FIELD") {
          const error = `${ERROR_TYPES.MISPLACED_DATATYPE} ${token.value} at position ${wordPosition}`;
          errors.push(error);
        }

        for (let keyword in DATATYPES) {
          if (keyword === token.value) {
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
          if (keyword === token.value) {
            operators.push({
              type: token.type,
              value: token.value,
              position: wordPosition,
            });
          }
        }
        break;

      default:
        const error = `${ERROR_TYPES.UNKOWN_KEYWORD} ${token.value} at postition ${wordPosition}`;
        errors.push(error);
        break;
    }
  });

  const IDS_LENGTH = ids.length;
  const LIMITS_LENGTH = limits.length;
  const OPERATORS_LENGTH = operators.length;
  const KEYWORDS_LENGTH = keywords.length;
  const DATATYPES_LENGTH = datatypes.length;
  const VALUE_LENGTH = values.length;
  const FIELDS_LENGTH = fields.length;

  switch (AST.action) {
    case "LET": {
      // Catching missing table
      if (TABLES_LENGTH === 0) {
        errors.push(ERROR_TYPES.MISSING_TABLE);
      }

      AST.all = false;

      // Catching when ID is created manually
      if (IDS_LENGTH !== 0) {
        let idsInfo = "";
        ids.forEach((id, i) => {
          idsInfo += `#${id.value} at position ${id.position}${IDS_LENGTH == i + 1 ? ", " : "."}`;
        });
        const error = `${ERROR_TYPES.ID_NOT_NEEDED} ${idsInfo}`;
        errors.push(error);
      }

      // Catching when limit is used on a LET query
      if (LIMITS_LENGTH !== 0) {
        let limitsInfo = "";
        limits.forEach((limit, i) => {
          limitsInfo += `@${limit.value} at position ${limit.position}${LIMITS_LENGTH == i + 1 ? "." : ","}`;
        });
        const error = `${ERROR_TYPES.LIMIT_UNUSABLE} ${limitsInfo}`;
        errors.push(error);
      }

      // Catching when operators are used on a LET query
      if (OPERATORS_LENGTH !== 0) {
        let operatorsInfo = "";
        operators.forEach((operator, i) => {
          operatorsInfo += `${operator.value} at position ${operator.position}${OPERATORS_LENGTH == i + 1 ? "." : ","}`;
        });
        const error = `${ERROR_TYPES.OPERATOR_UNUSABLE} ${operatorsInfo}`;
        errors.push(error);
      }

      // Catching when keywords are used on a LET query
      if (KEYWORDS_LENGTH !== 0) {
        let keywordsInfo = "";
        keywords.forEach((keyword, i) => {
          keywordsInfo += `${keyword.value} at position ${keyword.position}${KEYWORDS_LENGTH == i + 1 ? "." : ","}`;
        });
        const error = `${ERROR_TYPES.KEYWORD_UNUSABLE} ${keywordsInfo}`;
        errors.push(error);
      }

      // Catching when DATATYPES_LENGTH is different than FIELDS_LENGTH in a LET query
      if (DATATYPES_LENGTH === FIELDS_LENGTH) {
        // Creating columns
        fields.forEach((field, i) => {
          const target = values.filter(
            (value) => value?.position === field?.position + 2,
          );
          AST.columns.push({
            name: field.value,
            datatype: datatypes[i]?.value,
            value: target[0]?.value,
          });
        });
      } else if (DATATYPES_LENGTH > FIELDS_LENGTH) {
        // Catching missing field(s)
        let info = "";
        datatypes.forEach((type, i) => {
          if (fields[i]?.value === undefined) {
            info += `${type?.value} at position ${type?.position} doesn't relate to any field. `;
          }
        });

        const error = `${ERROR_TYPES.MISSING_FIELD} ${info}`;
        errors.push(error);
      } else if (DATATYPES_LENGTH < FIELDS_LENGTH) {
        // Catching missing datatype(s)
        let info = "";
        fields.forEach((field, i) => {
          if (datatypes[i]?.value === undefined) {
            info += `$${field?.value} at position ${field?.position} doesn't relate to any field. `;
          }
        });

        const error = `${ERROR_TYPES.MISSING_DATATYPE} ${info}`;
        errors.push(error);
      } else if (DATATYPES_LENGTH === 0 && FIELDS_LENGTH === 0) {
        errors.push(ERROR_TYPES.MISSING_FIELD_DATATYPE);
      }

      break;
    }

    case "POST": {
      // Catching missing table
      if (TABLES_LENGTH === 0) {
        errors.push(ERROR_TYPES.MISSING_TABLE);
      }

      AST.all = false;

      // Catching when ID is created manually
      if (IDS_LENGTH !== 0) {
        let idsInfo = "";
        ids.forEach((id, i) => {
          idsInfo += `#${id.value} at position ${id.position}${IDS_LENGTH == i + 1 ? ", " : "."}`;
        });
        const error = `${ERROR_TYPES.ID_NOT_NEEDED} ${idsInfo}`;
        errors.push(error);
      }

      // Catching when limit is used on a LET query
      if (LIMITS_LENGTH !== 0) {
        let limitsInfo = "";
        limits.forEach((limit, i) => {
          limitsInfo += `@${limit.value} at position ${limit.position}${LIMITS_LENGTH == i + 1 ? "." : ","}`;
        });
        const error = `${ERROR_TYPES.LIMIT_UNUSABLE} ${limitsInfo}`;
        errors.push(error);
      }

      // Catching when operators are used on a POST query
      if (OPERATORS_LENGTH !== 0) {
        let operatorsInfo = "";
        operators.forEach((operator, i) => {
          operatorsInfo += `${operator.value} at position ${operator.position}${OPERATORS_LENGTH == i + 1 ? "." : ","}`;
        });
        const error = `${ERROR_TYPES.OPERATOR_UNUSABLE} ${operatorsInfo}`;
        errors.push(error);
      }

      // Catching when keywords are used on a POST query
      if (KEYWORDS_LENGTH !== 0) {
        let keywordsInfo = "";
        keywords.forEach((keyword, i) => {
          keywordsInfo += `${keyword.value} at position ${keyword.position}${KEYWORDS_LENGTH == i + 1 ? "." : ","}`;
        });
        const error = `${ERROR_TYPES.KEYWORD_UNUSABLE} ${keywordsInfo}`;
        errors.push(error);
      }

      // Catching when DATATYPES are used on a POST query
      if (DATATYPES_LENGTH !== 0) {
        let typesInfo = "";
        datatypes.forEach((type, i) => {
          typesInfo += `${type.value} at position ${type.position}${DATATYPES_LENGTH == i + 1 ? "." : ","}`;
        });
        const error = `${ERROR_TYPES.DATATYPES_NOT_ALLOWED} ${typesInfo}`;
        errors.push(error);
      }

      // Catching when DATATYPES_LENGTH is different than FIELDS_LENGTH in a POST query
      if (VALUE_LENGTH === FIELDS_LENGTH) {
        // Creating columns
        fields.forEach((field, i) => {
          const target = values.filter(
            (value) => value?.position === field?.position + 1,
          );
          AST.columns.push({
            name: field.value,
            value: target[0]?.value,
          });
        });
      } else if (VALUE_LENGTH > FIELDS_LENGTH) {
        // Catching missing field(s)
        let info = "";
        datatypes.forEach((type, i) => {
          if (fields[i]?.value === undefined) {
            info += `${type?.value} at position ${type?.position} doesn't relate to any field. `;
          }
        });

        const error = `${ERROR_TYPES.MISSING_VALUE} ${info}`;
        errors.push(error);
      } else if (VALUE_LENGTH < FIELDS_LENGTH) {
        // Catching missing datatype(s)
        let info = "";
        fields.forEach((field, i) => {
          if (datatypes[i]?.value === undefined) {
            info += `$${field?.value} at position ${field?.position} doesn't relate to any field. `;
          }
        });

        const error = `${ERROR_TYPES.MISSING_VALUE} ${info}`;
        errors.push(error);
      } else if (DATATYPES_LENGTH === 0 && FIELDS_LENGTH === 0) {
        errors.push(ERROR_TYPES.MISSING_FIELD_VALUE);
      }

      break;
    }

    case "GET": {
      // Catching missing table
      if (TABLES_LENGTH === 0) {
        errors.push(ERROR_TYPES.MISSING_TABLE);
      }

      // Setting table
      AST.table = TABLES[0]?.value;

      // Catching duplicated WHERE keyword in an UPD query
      const WHERE_KEYWORDS = keywords.filter((key) => key?.value === "WHERE");
      const WHERE_LENGTH = WHERE_KEYWORDS.length;

      if (WHERE_LENGTH > 1) {
        let whereInfo = "";
        WHERE_KEYWORDS.forEach((key, i) => {
          whereInfo += `${key.value} at position ${key.position}${WHERE_LENGTH.length == i + 1 ? "." : ","}`;
        });

        const error = `${ERROR_TYPES.REPEATED_WHERE} ${whereInfo}`;
        errors.push(error);
      }

      let conditions = [];

      const CONDITIONS_TOKENS = TOKENS.slice(WHERE_KEYWORDS[0]?.position);
      const IS_WHERE = WHERE_KEYWORDS[0]?.value ? true : false;

      if (FIELDS_LENGTH > 0) {
        fields.forEach((field, i) => {
          // Getting keyword before the field
          const kTarget = keywords.filter(
            (key) => key?.position === field?.position - 1,
          );

          // Getting operator
          const opTarget = operators.filter(
            (op) => op?.position === field?.position + 1,
          );

          // Getting value
          const vTarget = values.filter(
            (value) =>
              value?.position === field?.position + 1 ||
              value?.position === field?.position + 2,
          );

          // Getting new scope
          const ScopeTarget = keywords.filter((key) => key?.value === ",");
          const scope = ScopeTarget[0]?.position === kTarget[0]?.position - 1;

          const cond = {
            name: field.value,
            value: vTarget[0]?.value,
            before: kTarget[0]?.value,
            newScope: scope,
            operator: opTarget[0]?.value,
          };
          conditions.push(cond);
        });
      }

      if (IS_WHERE) {
        AST.all = false;
      }

      if (limits[0]?.value !== undefined) AST.limit = limits[0]?.value;

      const DESC_KEYWORDS = keywords.filter((key) => key?.value === "DESC");
      const DESC_LENGTH = DESC_KEYWORDS.length;

      if (DESC_LENGTH > 1) {
        // Catching missing datatype(s)
        let info = "";
        DESC_KEYWORDS.forEach((key, i) => {
          info += `${key?.value} at position ${key?.position} ${DESC_LENGTH == i + 1 ? "." : ", "}`;
        });

        const error = `${ERROR_TYPES.DUPLICATED_DESC} ${info}`;
        errors.push(error);
      }

      if (DESC_KEYWORDS[0]?.value !== undefined) AST.order = "DESC";

      AST.condition = conditions;

      break;
    }

    case "UPD": {
      // Catching missing table
      if (TABLES_LENGTH === 0) {
        errors.push(ERROR_TYPES.MISSING_TABLE);
      }

      // Catching when DATATYPES are used on a LET query
      if (DATATYPES_LENGTH !== 0) {
        let typesInfo = "";
        datatypes.forEach((type, i) => {
          typesInfo += `${type.value} at position ${type.position}${DATATYPES_LENGTH == i + 1 ? "." : ","}`;
        });
        const error = `${ERROR_TYPES.DATATYPES_NOT_ALLOWED} ${typesInfo}`;
        errors.push(error);
      }

      // Catching duplicated WHERE keyword in an UPD query
      const WHERE_KEYWORDS = keywords.filter((key) => key?.value === "WHERE");
      const WHERE_LENGTH = WHERE_KEYWORDS.length;

      if (WHERE_LENGTH > 1) {
        let whereInfo = "";
        WHERE_KEYWORDS.forEach((key, i) => {
          whereInfo += `${key.value} at position ${key.position}${WHERE_LENGTH.length == i + 1 ? "." : ","}`;
        });

        const error = `${ERROR_TYPES.REPEATED_WHERE} ${whereInfo}`;
        errors.push(error);
      }

      let conditions = [];

      // Getting values & ids
      fields.forEach((field, i) => {
        const vTarget = values.filter(
          (value) =>
            value?.position === field?.position + 1 ||
            value?.position === field?.position + 2,
        );

        const idTarget = ids.filter(
          (id) =>
            id?.position === field?.position + 1 ||
            id?.position === field?.position + 2,
        );

        // Getting keyword before the field
        const kTarget = keywords.filter(
          (key) => key?.position === field?.position - 1,
        );

        // Getting SCOPE keyword if it exist
        const ScopeTarget = keywords.filter((key) => key?.value === ",");

        // Getting value
        const kValue =
          kTarget[0]?.value !== "WHERE" ? kTarget[0]?.value : "START";

        const scope = ScopeTarget[0]?.position === kTarget[0]?.position - 1;

        // Getting operator
        const opTarget = operators.filter(
          (op) => op?.position === field?.position + 1,
        );

        // Catching when id is getting updated
        if (kValue === undefined) {
          if (field.value === "id" || vTarget[0]?.value === "IDENTIFICATION") {
            const error = `${ERROR_TYPES.ID_CANNOT_UPDATE} ${vTarget[0]?.value} at position ${vTarget[0]?.position}`;
            errors.push(error);
          }

          // Creating AST
          AST.fields.push({
            name: field.value,
            value: vTarget[0]?.value,
          });
        } else {
          conditions.push({
            name: field.value,
            value: vTarget[0]?.value || idTarget[0]?.value,
            before: kValue,
            newScope: scope,
            operator: opTarget[0]?.value,
          });
        }

        // Set isCondition as true when the query has a condition, set all as false when the query does not targets all columns
        if (kTarget[0]?.value === "WHERE") {
          AST.isCondition = true;
          AST.all = false;
        }
      });

      AST.condition = conditions;
      break;
    }

    case "DLT": {
      // Catching missing table
      if (TABLES_LENGTH === 0) {
        errors.push(ERROR_TYPES.MISSING_TABLE);
      }

      // Catching when DATATYPES are used on a LET query
      if (DATATYPES_LENGTH !== 0) {
        let typesInfo = "";
        datatypes.forEach((type, i) => {
          typesInfo += `${type.value} at position ${type.position}${DATATYPES_LENGTH == i + 1 ? "." : ","}`;
        });
        const error = `${ERROR_TYPES.DATATYPES_NOT_ALLOWED} ${typesInfo}`;
        errors.push(error);
      }

      // Catching duplicated WHERE keyword in an UPD query
      const WHERE_KEYWORDS = keywords.filter((key) => key?.value === "WHERE");
      const WHERE_LENGTH = WHERE_KEYWORDS.length;

      if (WHERE_LENGTH > 1) {
        let whereInfo = "";
        WHERE_KEYWORDS.forEach((key, i) => {
          whereInfo += `${key.value} at position ${key.position}${WHERE_LENGTH.length == i + 1 ? "." : ","}`;
        });

        const error = `${ERROR_TYPES.REPEATED_WHERE} ${whereInfo}`;
        errors.push(error);
      }

      let conditions = [];

      const CONDITIONS_TOKENS = TOKENS.slice(WHERE_KEYWORDS[0]?.position);
      const IS_WHERE = WHERE_KEYWORDS[0]?.value ? true : false;

      if (FIELDS_LENGTH > 0) {
        fields.forEach((field, i) => {
          // Getting keyword before the field
          const kTarget = keywords.filter(
            (key) => key?.position === field?.position - 1,
          );

          // Getting operator
          const opTarget = operators.filter(
            (op) => op?.position === field?.position + 1,
          );

          // Getting value
          const vTarget = values.filter(
            (value) =>
              value?.position === field?.position + 1 ||
              value?.position === field?.position + 2,
          );

          // Getting new scope
          const ScopeTarget = keywords.filter((key) => key?.value === ",");
          const scope = ScopeTarget[0]?.position === kTarget[0]?.position - 1;

          const cond = {
            name: field.value,
            value: vTarget[0]?.value,
            before: kTarget[0]?.value,
            newScope: scope,
            operator: opTarget[0]?.value,
          };
          conditions.push(cond);
        });
      }

      if (IS_WHERE) {
        AST.all = false;
      }

      AST.condition = conditions;
      break;
    }

    case "DROP": {
      // Catching when DATATYPES are used on a DROP query
      if (DATATYPES_LENGTH !== 0) {
        let typesInfo = "";
        datatypes.forEach((type, i) => {
          typesInfo += `${type.value} at position ${type.position}${DATATYPES_LENGTH == i + 1 ? "." : ","}`;
        });
        const error = `${ERROR_TYPES.DATATYPES_NOT_ALLOWED} ${typesInfo}`;
        errors.push(error);
      }

      // Catching when limit is used on a DROP query
      if (LIMITS_LENGTH !== 0) {
        let limitsInfo = "";
        limits.forEach((limit, i) => {
          limitsInfo += `@${limit.value} at position ${limit.position}${LIMITS_LENGTH == i + 1 ? "." : ","}`;
        });
        const error = `${ERROR_TYPES.LIMIT_UNUSABLE} ${limitsInfo}`;
        errors.push(error);
      }

      // Catching when operators are used on a DROP query
      if (OPERATORS_LENGTH !== 0) {
        let operatorsInfo = "";
        operators.forEach((operator, i) => {
          operatorsInfo += `${operator.value} at position ${operator.position}${OPERATORS_LENGTH == i + 1 ? "." : ","}`;
        });
        const error = `${ERROR_TYPES.OPERATOR_UNUSABLE} ${operatorsInfo}`;
        errors.push(error);
      }

      // Catching when keywords are used on a DROP query
      if (KEYWORDS_LENGTH !== 0) {
        let keywordsInfo = "";
        keywords.forEach((keyword, i) => {
          keywordsInfo += `${keyword.value} at position ${keyword.position}${KEYWORDS_LENGTH == i + 1 ? "." : ","}`;
        });
        const error = `${ERROR_TYPES.KEYWORD_UNUSABLE} ${keywordsInfo}`;
        errors.push(error);
      }

      // Catching when keywords are used on a DROP query
      if (FIELDS_LENGTH !== 0) {
        let fieldInfo = "";
        fields.forEach((field, i) => {
          fieldInfo += `${field.value} at position ${field.position}${FIELDS_LENGTH == i + 1 ? "." : ","}`;
        });
        const error = `${ERROR_TYPES.FIELD_NOT_ALLOWED} ${fieldInfo}`;
        errors.push(error);
      }

      // Catching when IDs are used on a DROP query
      if (IDS_LENGTH !== 0) {
        let idsInfo = "";
        ids.forEach((id, i) => {
          idsInfo += `#${id.value} at position ${id.position}${IDS_LENGTH == i + 1 ? ", " : "."}`;
        });
        const error = `${ERROR_TYPES.ID_CAN_NOT_USED} ${idsInfo}`;
        errors.push(error);
      }

      // Catching missing table
      if (TABLES_LENGTH !== 0) {
        AST.table = TABLES[0]?.value;
        AST.all = false;
      }
      break;
    }

    default:
      errors.push(ERROR_TYPES.MISSING_CRUD_OPERATION);
      return errors;
      break;
  }

  return AST;
}

export function storage(AST) {
  return {
    let() {
      // Create DB
      const dbName = "app";
      const request = indexedDB.open(dbName, 1);

      request.onerror = (e) => {
        const error = ERROR_TYPES.OPENING_DB + e;
        errors.push(error);
      };

      let tableExist = false;
      // Handle attempts to create a second table
      indexedDB.open("app");
      request.onsuccess = (event) => {
        const db = event.target.result;
        const storeNames = db.objectStoreNames;
        if (storeNames[0] !== undefined && storeNames[0].trim() !== "") {
          tableExist = true;
        }
      };

      if (!tableExist) {
        // Create table
        request.onupgradeneeded = (event) => {
          const db = event.target.result;

          const store = db.createObjectStore(AST.table, {
            keyPath: "id",
          });

          store.add({ metadata: AST.columns, id: 0 });

          console.log(AST.table + " was created successfully!");
        };
      } else {
        const error = `${ERROR_TYPES.TABLE_EXISTS} old table: ${storeNames[0]}, new table: ${AST.table}.`;
        errors.push(error);
      }
    },

    post() {
      // Open the database
      const db = indexedDB.open("app", 1);
      let colsExists = false;

      db.onsuccess = function (event) {
        // Grab the database instance from the success event
        const db = event.target.result;

        const transaction = db.transaction(AST.table, "readwrite");
        const store = transaction.objectStore(AST.table);

        const request = store.openCursor(null, "prev");
        console.log("Request: ", request);

        request.onsuccess = function (e) {
          const cursor = e.target.result;
          console.log();

          if (cursor) {
            const metadata =
              cursor.key < 1 ? cursor?.value?.metadata : cursor?.value?.data;

            const data = AST.columns;
            let cols = [];

            console.log("metadata: ", metadata);
            console.log("value: ", cursor);

            data.forEach((d) => {
              metadata.forEach((mdata) => {
                if (d.name === mdata.name) {
                  if (mdata.type === "INT") {
                    console.log("age: ", parseInt(d.value));
                    cols.push({ name: d.name, value: parseInt(d.value) });
                  } else if (d.type === "FLT") {
                    cols.push({
                      name: d.name,
                      value: parseFloat(d.value),
                    });
                  } else if (d.type === "BOOL") {
                    const value = d.value === "true" ? true : false;
                    cols.push({ name: d.name, value: value });
                  } else {
                    cols.push({ name: d.name, value: d.value });
                  }
                }
              });
            });

            store.add({ id: cursor.key + 1, data: cols });

            console.log("Data created successfully!");
          } else {
            const error = ERROR_TYPES.MISSING_METADATA + AST.table;
            errors.push(error);
          }
        };
      };

      db.onerror = function (event) {
        const error = ERROR_TYPES.FAILED_DB + event.target.error;
        errors.push(error);
      };
    },

    get() {},
  };
}

export function potato(VALUE) {
  const AST = parser(VALUE);
  const action = AST.action;

  if (action === "LET") {
    storage(AST).let();
  } else if (action === "POST") {
    storage(AST).post();
  }

  console.log("ERRORS: ", errors);
  console.log("AST", AST);
}
