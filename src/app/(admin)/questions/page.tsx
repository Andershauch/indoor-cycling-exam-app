import { AdminRole } from "@prisma/client";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { QuestionForm } from "@/components/admin/question-form";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/ui/admin-table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  createQuestionAction,
  deleteQuestionAction,
  moveQuestionAction,
  updateQuestionAction,
} from "@/lib/admin/actions";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  buildQuestionFormState,
  getActiveExamAdminSnapshot,
  getQuestionFormDefaults,
} from "@/lib/admin/data";

export const dynamic = "force-dynamic";

type QuestionsPageProps = {
  searchParams: Promise<{
    edit?: string;
    editError?: string;
  }>;
};

const questionColumns = [
  { key: "position", label: "Rækkefølge" },
  { key: "question", label: "Spørgsmål" },
  { key: "correct", label: "Korrekt svar" },
  { key: "actions", label: "Handlinger", align: "right" as const },
];

const attemptColumns = [
  { key: "participant", label: "Deltager" },
  { key: "status", label: "Status" },
  { key: "score", label: "Score", align: "right" as const },
];

function formatAttemptStatus(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "Afleveret";
    case "AUTO_SUBMITTED":
      return "Auto-afleveret";
    default:
      return "I gang";
  }
}

export default async function QuestionsPage({ searchParams }: QuestionsPageProps) {
  await requireAdminSession(AdminRole.SUPER_ADMIN);

  const [{ edit, editError }, snapshot] = await Promise.all([
    searchParams,
    getActiveExamAdminSnapshot(),
  ]);

  if (!snapshot) {
    return (
      <div className="space-y-6 py-6 sm:py-8 lg:py-10">
        <PageHeader
          eyebrow="System"
          title="Ingen prøveformater endnu"
          titleClassName="text-[clamp(1.9rem,4vw,3rem)] leading-[0.98] tracking-[-0.03em]"
          description="Importér eller opret først et prøveformat, før spørgsmålene kan redigeres."
          descriptionClassName="max-w-3xl"
        />
      </div>
    );
  }

  const questionsLocked = snapshot.examSet.hasAttempts;
  const selectedQuestion = snapshot.questions.find(
    (question) => question.examQuestionId === edit,
  );

  const questionRows = snapshot.questions.map((entry, index) => {
    const correctOption = entry.question.options.find((option) => option.isCorrect);

    return {
      position: (
        <div className="space-y-2">
          <p className="font-display text-3xl leading-none">{entry.position}</p>
          <div className="flex flex-wrap gap-2">
            <form action={moveQuestionAction}>
              <input type="hidden" name="examQuestionId" value={entry.examQuestionId} />
              <input type="hidden" name="direction" value="up" />
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={questionsLocked || index === 0}
              >
                Op
              </Button>
            </form>
            <form action={moveQuestionAction}>
              <input type="hidden" name="examQuestionId" value={entry.examQuestionId} />
              <input type="hidden" name="direction" value="down" />
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={questionsLocked || index === snapshot.questions.length - 1}
              >
                Ned
              </Button>
            </form>
          </div>
        </div>
      ),
      question: (
        <div className="space-y-2">
          <p className="font-bold leading-6">{entry.question.questionText}</p>
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
            {entry.question.category ?? "Uden kategori"} · {entry.question.externalKey}
          </p>
        </div>
      ),
      correct: correctOption ? (
        <div className="space-y-2">
          <span className="inline-flex rounded-[var(--radius-pill)] border-2 border-border bg-background-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]">
            {correctOption.label}
          </span>
          <p className="text-sm leading-6">{correctOption.text}</p>
        </div>
      ) : (
        "Ikke sat"
      ),
      actions: (
        <div className="flex flex-wrap justify-end gap-2">
          <Button href={`/questions?edit=${entry.examQuestionId}`} variant="secondary" size="sm">
            Redigér
          </Button>
          <form action={deleteQuestionAction}>
            <input type="hidden" name="examQuestionId" value={entry.examQuestionId} />
            <Button type="submit" variant="ghost" size="sm" disabled={questionsLocked}>
              Slet
            </Button>
          </form>
        </div>
      ),
    };
  });

  const recentAttemptRows = snapshot.recentAttempts.map((attempt) => ({
    participant: (
      <div className="space-y-1">
        <p className="font-bold">{attempt.participantName || "Ukendt deltager"}</p>
        <p className="text-xs text-muted-foreground">
          {attempt.participantEmail || "Ingen e-mail"}
        </p>
      </div>
    ),
    status: formatAttemptStatus(attempt.status),
    score:
      attempt.scorePercentage === null ? "—" : `${Math.round(attempt.scorePercentage)}%`,
  }));

  return (
    <div className="space-y-6 py-6 sm:py-8 lg:space-y-7 lg:py-8">
      <PageHeader
        eyebrow="System"
        title="Prøveformater"
        titleClassName="text-[clamp(2rem,4.4vw,3.2rem)] leading-[0.98] tracking-[-0.035em]"
        description="Her vedligeholder superadmin systemets prøveformat: spørgsmål, korrekte svar, rækkefølge, tidsgrænse og beståelseskrav."
        descriptionClassName="max-w-3xl"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Spørgsmål"
          value={String(snapshot.examSet.questionCount)}
          helper="Fast rækkefølge i prøveformatet."
        />
        <AdminStatCard
          label="Forsøg"
          value={String(snapshot.stats.totalAttempts)}
          helper="Samlet antal deltagerforsøg."
        />
        <AdminStatCard
          label="Afleveret"
          value={String(snapshot.stats.completedAttempts)}
          helper="Forsøg med beregnet resultat."
        />
        <AdminStatCard
          label="Snit"
          value={
            snapshot.stats.averageScore === null
              ? "—"
              : `${Math.round(snapshot.stats.averageScore)}%`
          }
          helper="Gennemsnit af afleverede forsøg."
        />
      </section>

      {editError ? (
        <Card tone="strong" title="Fejl ved opdatering" eyebrow="Fejl">
          <p className="text-base leading-7 text-foreground">{editError}</p>
        </Card>
      ) : null}

      {questionsLocked ? (
        <Card tone="strong" title="Prøveformatet er låst" eyebrow="Databeskyttelse">
          <p className="text-base leading-7 text-foreground">
            Dette prøveformat har allerede deltagerforsøg. Derfor er opret, redigér, slet og
            rækkefølgeændringer låst for at beskytte resultater og rapportdata.
          </p>
        </Card>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card
          title="Aktivt prøveformat"
          eyebrow="Format"
          titleClassName="text-[clamp(1.9rem,3.8vw,2.7rem)] leading-[0.97] tracking-[-0.03em]"
          className="space-y-5"
        >
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-bold uppercase tracking-[0.08em]">Titel</dt>
              <dd>{snapshot.examSet.title}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-[0.08em]">Version</dt>
              <dd>{snapshot.examSet.version}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-[0.08em]">Varighed</dt>
              <dd>{snapshot.examSet.timeLimitMinutes} minutter</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-[0.08em]">Bestået</dt>
              <dd>{snapshot.examSet.passPercentage}%</dd>
            </div>
          </dl>

          <AdminTable
            caption="Seneste forsøg"
            columns={attemptColumns}
            rows={recentAttemptRows}
            emptyMessage="Ingen deltagerforsøg endnu."
          />
        </Card>

        <Card
          title={selectedQuestion ? "Redigér spørgsmål" : "Opret spørgsmål"}
          eyebrow={selectedQuestion ? "Vedligehold" : "Nyt spørgsmål"}
          titleClassName="text-[clamp(1.9rem,3.8vw,2.7rem)] leading-[0.97] tracking-[-0.03em]"
        >
          {questionsLocked ? (
            <p className="text-sm leading-7 text-muted-foreground">
              Formularen er låst, fordi den aktive prøve allerede bruges af deltagere.
            </p>
          ) : (
            <QuestionForm
              title={selectedQuestion ? "Redigér eksisterende spørgsmål" : "Tilføj nyt spørgsmål"}
              description={
                selectedQuestion
                  ? "Det korrekte svar er tydeligt markeret og kan ændres her."
                  : "Brug samme enkle struktur som i importfilen. Ét korrekt svar pr. spørgsmål."
              }
              submitLabel={selectedQuestion ? "Gem ændringer" : "Opret spørgsmål"}
              action={selectedQuestion ? updateQuestionAction : createQuestionAction}
              values={
                selectedQuestion
                  ? buildQuestionFormState({
                      externalKey: selectedQuestion.question.externalKey,
                      category: selectedQuestion.question.category,
                      questionText: selectedQuestion.question.questionText,
                      explanation: selectedQuestion.question.explanation,
                      options: selectedQuestion.question.options.map((option) => ({
                        label: option.label,
                        text: option.text,
                        isCorrect: option.isCorrect,
                      })),
                    })
                  : getQuestionFormDefaults()
              }
              hiddenFields={
                selectedQuestion ? (
                  <input
                    type="hidden"
                    name="questionId"
                    value={selectedQuestion.question.id}
                  />
                ) : null
              }
            />
          )}
        </Card>
      </section>

      <AdminTable
        caption="Spørgsmål i aktivt prøveformat"
        columns={questionColumns}
        rows={questionRows}
        emptyMessage="Der er endnu ingen spørgsmål i den aktive prøve."
      />
    </div>
  );
}
