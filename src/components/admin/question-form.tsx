import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/text-input";

type QuestionFormOption = {
  label: string;
  text: string;
};

type QuestionFormValues = {
  externalKey: string;
  category: string;
  questionText: string;
  explanation: string;
  options: QuestionFormOption[];
  correctOptionLabel: string;
};

type QuestionFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  values: QuestionFormValues;
  hiddenFields?: ReactNode;
};

export function QuestionForm({
  title,
  description,
  submitLabel,
  action,
  values,
  hiddenFields,
}: QuestionFormProps) {
  return (
    <form action={action} className="grid gap-4">
      {hiddenFields}
      <div className="space-y-2">
        <h3 className="text-xl font-bold uppercase tracking-[-0.02em]">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <TextInput
        id={`${submitLabel}-externalKey`}
        name="externalKey"
        label="Ekstern nøgle"
        defaultValue={values.externalKey}
        placeholder="question-indoor-cycling-001"
        hint="Kan stå tom ved oprettelse. Så bliver der dannet en nøgle automatisk."
      />
      <TextInput
        id={`${submitLabel}-category`}
        name="category"
        label="Kategori"
        defaultValue={values.category}
        placeholder="Instruktørrolle"
      />
      <label className="flex flex-col gap-2">
        <span className="text-sm font-bold uppercase tracking-[0.08em]">Spørgsmål</span>
        <textarea
          name="questionText"
          defaultValue={values.questionText}
          rows={4}
          className="min-h-28 rounded-[var(--radius-sm)] border-2 border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
          placeholder="Skriv selve spørgsmålet"
          required
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-bold uppercase tracking-[0.08em]">Forklaring</span>
        <textarea
          name="explanation"
          defaultValue={values.explanation}
          rows={3}
          className="min-h-24 rounded-[var(--radius-sm)] border-2 border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
          placeholder="Valgfri forklaring til senere brug"
        />
      </label>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-bold uppercase tracking-[0.08em]">
          Svarmuligheder
        </legend>
        {values.options.map((option, index) => (
          <div
            key={`${option.label}-${index}`}
            className="surface-card grid gap-3 p-4 sm:grid-cols-[auto_1fr_auto]"
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id={`${submitLabel}-correct-${option.label}`}
                name="correctOptionLabel"
                value={option.label}
                defaultChecked={values.correctOptionLabel === option.label}
              />
              <label
                htmlFor={`${submitLabel}-correct-${option.label}`}
                className="text-sm font-bold uppercase tracking-[0.08em]"
              >
                Korrekt
              </label>
            </div>
            <input type="hidden" name="optionLabel" value={option.label} />
            <TextInput
              id={`${submitLabel}-option-${option.label}`}
              name="optionText"
              label={`Svar ${option.label}`}
              defaultValue={option.text}
              placeholder={`Svartekst ${option.label}`}
            />
            <div className="flex items-end">
              <span className="rounded-[var(--radius-pill)] border-2 border-border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em]">
                {option.label}
              </span>
            </div>
          </div>
        ))}
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">
          {submitLabel}
        </Button>
        <Button href="/admin" variant="secondary" size="lg">
          Nulstil
        </Button>
      </div>
    </form>
  );
}
