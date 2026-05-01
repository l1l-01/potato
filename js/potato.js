const KEYWORDS = {
  LET: "KEYWORD",
  SET: "KEYWORD",
  GET: "KEYWORD",
  UPD: "KEYWORD",
  DLT: "KEYWORD",
  PUT: "KEYWORD",
  DROP: "KEYWORD",
  ASEC: "KEYWORD",
  DESC: "KEYWORD",
  ALL: "KEYWORD",
  STR: "DATATYPE",
  INT: "DATATYPE",
  DEC: "DATATYPE",
  BOOL: "DATATYPE",
  DATE: "DATATYPE",
  ENUM: "DATATYPE",
  AND: "LOGICAL",
  OR: "LOGICAL",
  WHERE: "LOGICAL",
  BETWEEN: "LOGICAL",
  SUM: "FUNCTION",
  AVG: "FUNCTION",
  COUNT: "FUNCTION",
};

const PREFIXES = {
  ":": "VALUE",
  "@": "LIMITAION",
  "#": "IDENTIFICATION",
};

const OPERATORS = {
  "!": "OPERATOR",
  ">=": "OPERATOR",
  "<=": "OPERATOR",
  ">": "OPERATOR",
  "<": "OPERATOR",
};

export function lexer(VALUE) {
  let tokens = [];
  let type = null;
  const MAIN_RE = new RegExp(
    `\\b(${Object.keys(KEYWORDS).join("|")})\\b`,
    "gi",
  );
  const SUB_RE = new RegExp(`\\${Object.keys(OPERATORS).join("|")}\\i`, "gi");

  const words = VALUE.split(/(\s+)/);
  words.forEach((word, i) => {
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

        if (type != type.toUpperCase()) {
          tokens.push({ type: "IDENTIFIER", value: word, position: i });
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

  return tokens;
}
