const fs = require("fs");

const Papa = require("papaparse");

function parseCSV(path) {
  const csv = fs.readFileSync(path, "utf8");

  return Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
  }).data;
}

module.exports = {
  parseCSV,
};
