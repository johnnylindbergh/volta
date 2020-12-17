// Just testing around here for now

const fs = require('fs');
const { parseGrammar } = require('./parse.js');

fs.readFile("./grammar.txt", { encoding: "UTF-8" }, (err, data) => {
  let g = parseGrammar(data);
  // console.log(JSON.stringify(g));
  console.log(g.generateSentenceStructures(12));
});