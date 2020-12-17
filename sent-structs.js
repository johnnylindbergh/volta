
const sys = require('./settings.js');
const { parseGrammar } = require('./grammar/cfg-parse.js');
const fs = require('fs');

// represents an abstract part of speech
class PartOfSpeech {
  constructor(_kind) {
    this.kind = _kind;
    this.isPartOfSpeech = true;
  }
}

// represents a literal word
class Word {
  constructor(_content) {
    this.content = _content;
    this.isWord = true;
  }
}

// convert a CFG node into a corresponding part of speech
function nodeToPOS(node) {
  if (node.isLiteral) {
    return new Word(node.content);
  } else {
    return new PartOfSpeech(node.label);
  }
}

// Generate a list of sentence structures, bounded by a given length.
// Sentence structures are themselves lists of parts of speech & word literals.
function generateStructures(sentStructsMax, cb) {
  // read from the grammar file
  fs.readFile(sys.GRAMMAR_FILE, { encoding: "UTF-8" }, (err, fileContents) => {
    if (err) throw err;

    let grammar = parseGrammar(fileContents);

    // generate sentence structures, in terms of CFG nodes (terminals/literals)
    let ssWithNodes = grammar.sentStructs(sentStructsMax);

    // convert nodes to parts of speech
    let structures = ssWithNodes.map((ss) => {
      return ss.map((node) => nodeToPOS(node));
    });

    cb(structures);
  });
}

module.exports = { generateStructures }