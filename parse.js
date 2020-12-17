const { CFG, NonTerminal, Terminal, Literal } = require('./grammar.js');

const tokenPatterns = [
  { name: "lhs", re: /^<(.+?)>\s+=/ },
  { name: "symbol", re: /^<(.+?)>/ },
  { name: "literal", re: /^"(.+?)"/ },
  { name: "whitespace", re: /^\s+/ },
  { name: "pipe", re: /^\|/ },
  { name: "equals", re: /^=/ },
  { name: "comment", re: /^#.*?\n/ }
];

class Token {
  constructor(_name, _lexeme) {
    this.name = _name;
    this.lexeme = _lexeme;
  }
}

// construct a token out of a RegEx match & the pattern that matched it
function makeToken(match, pattern) {
  switch (pattern.name) {
    case "lhs":
    case "symbol":
    case "literal":
      if (match.length < 2) {
        throw Error(`expected match group in ${match}`);
      }

      return new Token(pattern.name, match[1]);
    
    default:
      return new Token(pattern.name);
  }
}

// Convert the input text into a list of tokens
function tokenize(text) {
  let tokens = [];
  let tokenSize;

  while (text.length > 0) {
    let matchedToken;

    // try each token pattern against the text
    for (var i = 0; i < tokenPatterns.length; i++) {
      let p = tokenPatterns[i];
      let m = text.match(p.re);

      if (!m || m.length == 0) continue;  // try next pattern

      matchedToken = makeToken(m, p);
      tokenSize = m[0].length;
      break;
    }

    if (!matchedToken) {
      throw Error(`Invalid token at '${text}'`);
    }

    if (matchedToken.name != "whitespace" && matchedToken.name != "comment") {
      tokens.push(matchedToken);
    }

    text = text.substring(tokenSize);
  }

  return tokens;
}

// Construct a CFG from a string encoding
function parseGrammar(text) {
  let tokens = tokenize(text);
  let startSym;
  let nonTerminals = [];
  let labelToNode = {};
  let isLiteral = {};

  for (var i = 0; i < tokens.length; i++) {
    let tok = tokens[i];

    if (tok.name != "lhs") {
      throw Error(`LHS expected, got ${tok}`);
    }

    // first production rule determines start symbol
    if (i == 0) {
      startSym = tok.lexeme;
    }

    let expansions = [];
    let currentExpansion = [];

    i++;
    if (i >= tokens.length) {
      throw Error(`expected RHS, got end of input`);
    }

    // parse righthand size of this rule
    for (; i < tokens.length; i++) {
      let nextTok = tokens[i];

      // stop parsing this rule when new LHS encountered
      if (nextTok.name == "lhs") {
        i--;
        break;
      }
      // on |, start new expansion
      if (nextTok.name == "pipe") {
        expansions.push(currentExpansion);
        currentExpansion = [];
        continue;
      }

      // otherwise, symbol/literal: add lexeme to current expansion
      currentExpansion.push(nextTok.lexeme);

      // note that this symbol represents a literal
      if (nextTok.name == "literal") {
        isLiteral[nextTok.lexeme] = true;
      }
    }

    if (currentExpansion.length != 0) {
      expansions.push(currentExpansion);
    }

    // add node to non-terminals
    let nonTerm = new NonTerminal(tok.lexeme, expansions);
    nonTerminals.push(nonTerm);
    labelToNode[nonTerm.label] = nonTerm;
  }

  // for each non-terminal
  for (var i = 0; i < nonTerminals.length; i++) {
    let nonTerm = nonTerminals[i];
    // for each expansion
    for (var j = 0; j < nonTerm.expansions.length; j++) {
      let exp = nonTerm.expansions[j];
      // for each symbol in the expansion
      for (var k = 0; k < exp.length; k++) {
        let sym = exp[k];

        if (labelToNode[sym]) continue;

        // add entry to in label-to-node mapping
        if (isLiteral[sym]) {
          labelToNode[sym] = new Literal(sym);
        } else {
          labelToNode[sym] = new Terminal(sym);
        }
      }
    }
  }

  return new CFG(startSym, labelToNode);
}

module.exports = { parseGrammar }