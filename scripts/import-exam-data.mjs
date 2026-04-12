import { PrismaClient } from "@prisma/client";

import { loadExamImportFile, validateExamImportData } from "./lib/exam-import.mjs";

const prisma = new PrismaClient();

async function main() {
  const inputPath = process.argv[2] ?? "data/exam-import.template.json";
  const { resolvedPath, parsed } = await loadExamImportFile(inputPath);
  const data = validateExamImportData(parsed);

  const existingExam = await prisma.examSet.findUnique({
    where: { slug: data.examSet.slug },
    select: {
      id: true,
      attempts: {
        select: { id: true },
        take: 1,
      },
    },
  });

  if (existingExam?.attempts.length) {
    throw new Error(
      "Import blev afbrudt, fordi eksamen allerede har deltagersvar eller forsøg. Opret i stedet en ny version eller ryd data bevidst først.",
    );
  }

  const now = new Date();

  await prisma.examSet.updateMany({
    data: {
      isActive: false,
    },
  });

  const examSet = await prisma.examSet.upsert({
    where: { slug: data.examSet.slug },
    update: {
      title: data.examSet.title,
      description: data.examSet.description,
      version: data.examSet.version,
      timeLimitMinutes: data.examSet.timeLimitMinutes,
      passPercentage: data.examSet.passPercentage,
      isActive: true,
      importedAt: now,
      publishedAt: now,
    },
    create: {
      slug: data.examSet.slug,
      title: data.examSet.title,
      description: data.examSet.description,
      version: data.examSet.version,
      timeLimitMinutes: data.examSet.timeLimitMinutes,
      passPercentage: data.examSet.passPercentage,
      isActive: true,
      importedAt: now,
      publishedAt: now,
    },
  });

  await prisma.examQuestion.deleteMany({
    where: {
      examSetId: examSet.id,
    },
  });

  for (const question of data.questions) {
    const savedQuestion = await prisma.question.upsert({
      where: {
        externalKey: question.externalKey,
      },
      update: {
        category: question.category,
        questionText: question.questionText,
        explanation: question.explanation,
        sourceReference: question.sourceReference,
      },
      create: {
        externalKey: question.externalKey,
        category: question.category,
        questionText: question.questionText,
        explanation: question.explanation,
        sourceReference: question.sourceReference,
      },
    });

    await prisma.answerOption.deleteMany({
      where: {
        questionId: savedQuestion.id,
      },
    });

    await prisma.answerOption.createMany({
      data: question.options.map((option) => ({
        questionId: savedQuestion.id,
        label: option.label,
        optionText: option.text,
        isCorrect: option.isCorrect,
        sortOrder: option.sortOrder,
      })),
    });

    await prisma.examQuestion.create({
      data: {
        examSetId: examSet.id,
        questionId: savedQuestion.id,
        position: question.questionNumber,
      },
    });
  }

  console.log(`Import gennemført fra ${resolvedPath}`);
  console.log(`Eksamen: ${examSet.title} (${examSet.slug})`);
  console.log(`Spørgsmål importeret: ${data.questions.length}`);
}

main()
  .catch((error) => {
    console.error("Import fejlede.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
