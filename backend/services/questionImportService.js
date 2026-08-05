const XLSX = require("xlsx");

function parseExcel(path) {
  const workbook = XLSX.readFile(path);

  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  return XLSX.utils.sheet_to_json(sheet);
}

module.exports = {
  parseExcel,
};
