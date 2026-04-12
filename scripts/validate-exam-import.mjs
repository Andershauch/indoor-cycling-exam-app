import { loadExamImportFile, validateExamImportData } from "./lib/exam-import.mjs";

async function main() {
  const inputPath = process.argv[2] ?? "data/exam-import.template.json";
  const { resolvedPath, parsed } = await loadExamImportFile(inputPath);
  const data = validateExamImportData(parsed);

  console.log(`Importfil valideret: ${resolvedPath}`);
  console.log(`Eksamen: ${data.examSet.title} (${data.examSet.slug})`);
  console.log(`Antal spørgsmål: ${data.questions.length}`);
}

main().catch((error) => {
  console.error("Validering fejlede.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
