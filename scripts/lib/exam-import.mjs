import fs from "node:fs/promises";
import path from "node:path";

function ensureObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} skal være et objekt.`);
  }
}

function ensureString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} skal være en ikke-tom tekst.`);
  }

  return value.trim();
}

function ensureOptionalString(value, label) {
  if (value == null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${label} skal være tekst, hvis feltet er udfyldt.`);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ensureInteger(value, label, minimum = 0) {
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`${label} skal være et heltal på mindst ${minimum}.`);
  }

  return value;
}

export async function loadExamImportFile(filePath) {
  const resolvedPath = path.resolve(filePath);
  const rawContent = await fs.readFile(resolvedPath, "utf8");
  const parsed = JSON.parse(rawContent);

  return {
    resolvedPath,
    parsed,
  };
}

export function validateExamImportData(payload) {
  ensureObject(payload, "Importdata");
  ensureObject(payload.examSet, "examSet");

  const examSet = {
    slug: ensureString(payload.examSet.slug, "examSet.slug"),
    title: ensureString(payload.examSet.title, "examSet.title"),
    description: ensureOptionalString(
      payload.examSet.description,
      "examSet.description",
    ),
    version: ensureInteger(payload.examSet.version ?? 1, "examSet.version", 1),
    timeLimitMinutes: ensureInteger(
      payload.examSet.timeLimitMinutes,
      "examSet.timeLimitMinutes",
      1,
    ),
    passPercentage: ensureInteger(
      payload.examSet.passPercentage,
      "examSet.passPercentage",
      0,
    ),
  };

  if (examSet.passPercentage > 100) {
    throw new Error("examSet.passPercentage må ikke være over 100.");
  }

  if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
    throw new Error("questions skal indeholde mindst ét spørgsmål.");
  }

  const seenExternalKeys = new Set();
  const seenQuestionNumbers = new Set();

  const questions = payload.questions.map((question, questionIndex) => {
    ensureObject(question, `questions[${questionIndex}]`);

    const externalKey = ensureString(
      question.externalKey,
      `questions[${questionIndex}].externalKey`,
    );
    const questionNumber = ensureInteger(
      question.questionNumber,
      `questions[${questionIndex}].questionNumber`,
      1,
    );

    if (seenExternalKeys.has(externalKey)) {
      throw new Error(`externalKey '${externalKey}' forekommer mere end én gang.`);
    }

    if (seenQuestionNumbers.has(questionNumber)) {
      throw new Error(
        `questionNumber '${questionNumber}' forekommer mere end én gang.`,
      );
    }

    seenExternalKeys.add(externalKey);
    seenQuestionNumbers.add(questionNumber);

    if (!Array.isArray(question.options) || question.options.length < 2) {
      throw new Error(
        `questions[${questionIndex}].options skal indeholde mindst to svarmuligheder.`,
      );
    }

    const seenLabels = new Set();
    let correctOptionCount = 0;

    const options = question.options.map((option, optionIndex) => {
      ensureObject(option, `questions[${questionIndex}].options[${optionIndex}]`);

      const label = ensureString(
        option.label,
        `questions[${questionIndex}].options[${optionIndex}].label`,
      );

      if (seenLabels.has(label)) {
        throw new Error(
          `Label '${label}' forekommer mere end én gang i spørgsmål ${questionNumber}.`,
        );
      }

      seenLabels.add(label);

      if (typeof option.isCorrect !== "boolean") {
        throw new Error(
          `questions[${questionIndex}].options[${optionIndex}].isCorrect skal være true eller false.`,
        );
      }

      if (option.isCorrect) {
        correctOptionCount += 1;
      }

      return {
        label,
        text: ensureString(
          option.text,
          `questions[${questionIndex}].options[${optionIndex}].text`,
        ),
        isCorrect: option.isCorrect,
        sortOrder: optionIndex + 1,
      };
    });

    if (correctOptionCount !== 1) {
      throw new Error(
        `Spørgsmål ${questionNumber} skal have præcis én korrekt svarmulighed.`,
      );
    }

    return {
      externalKey,
      questionNumber,
      category: ensureOptionalString(
        question.category,
        `questions[${questionIndex}].category`,
      ),
      questionText: ensureString(
        question.questionText,
        `questions[${questionIndex}].questionText`,
      ),
      explanation: ensureOptionalString(
        question.explanation,
        `questions[${questionIndex}].explanation`,
      ),
      sourceReference: ensureOptionalString(
        question.sourceReference,
        `questions[${questionIndex}].sourceReference`,
      ),
      options,
    };
  });

  const sortedNumbers = [...seenQuestionNumbers].sort((a, b) => a - b);

  sortedNumbers.forEach((questionNumber, index) => {
    const expected = index + 1;

    if (questionNumber !== expected) {
      throw new Error(
        `questionNumber skal være fortløbende. Forventede ${expected}, men fandt ${questionNumber}.`,
      );
    }
  });

  return {
    examSet,
    questions,
  };
}
