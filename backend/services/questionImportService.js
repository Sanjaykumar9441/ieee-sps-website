const XLSX = require("xlsx");

const Question = require("../models/Question");
const validator = require("../validators/questionValidator");
const duplicateService = require("./questionDuplicateService");

function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);

  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  return XLSX.utils.sheet_to_json(sheet);
}

async function importQuestions(questionBankId, filePath) {
  let rows = parseExcel(filePath);

  rows = duplicateService.removeDuplicates(rows);

  const result = {
    imported: 0,
    skipped: 0,
    errors: [],
  };

  for (const row of rows) {
    row.bank_id = questionBankId;

    const validationError = validator.validate(row);

    if (validationError) {
      result.skipped++;

      result.errors.push({
        question: row.question_text || "",
        reason: validationError,
      });

      continue;
    }

    const exists = await duplicateService.isDuplicate(
      questionBankId,
      row.question_text
    );

    if (exists) {
      result.skipped++;

      result.errors.push({
        question: row.question_text,
        reason: "Duplicate question",
      });

      continue;
    }

    const { error } = await Question.create(row);

    if (error) {
      result.skipped++;

      result.errors.push({
        question: row.question_text,
        reason: error.message,
      });

      continue;
    }

    result.imported++;
  }

  return result;
}

module.exports = {
  parseExcel,
  importQuestions,
};