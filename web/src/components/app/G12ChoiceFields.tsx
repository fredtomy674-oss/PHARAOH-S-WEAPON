import type {
  FirstForeignLanguage,
  G12Choices,
  ReligionChoice,
  SecondForeignLanguage,
  StudyLanguage,
} from "../../api.js";
import {
  FIRST_LANGUAGE_OPTIONS,
  RELIGION_OPTIONS,
  STUDY_LANGUAGE_OPTIONS,
  secondLanguageOptions,
} from "../../g12Choices.js";

interface Props {
  choices: G12Choices;
  onChange: (patch: Partial<G12Choices>) => void;
  /** Prefix for stable test ids, e.g. "first-run" or "student". */
  testIdPrefix: string;
}

/**
 * PHASE 192 — the four choice groups shared by onboarding and the student
 * manager. The parent owns state; this component only keeps the Ministry
 * pairing rule (second language ≠ first) intact when the first changes.
 */
export function G12ChoiceFields({ choices, onChange, testIdPrefix }: Props) {
  const chooseFirst = (code: FirstForeignLanguage) => {
    const allowed = secondLanguageOptions(code).map((option) => option.code);
    const second = allowed.includes(choices.secondForeignLanguage)
      ? choices.secondForeignLanguage
      : (allowed[0] ?? "fr");
    onChange({ firstForeignLanguage: code, secondForeignLanguage: second });
  };

  return (
    <div className="g12-choices" data-testid={`${testIdPrefix}-g12-choices`}>
      <h3>اختيارات الصف الثالث الثانوي</h3>
      <p className="g12-choices__lead">
        هذه الاختيارات تحدد نسخة كل كتاب: لغة الدراسة، واللغة الأجنبية الأولى والثانية، وكتاب
        التربية الدينية. لن تظهر لك إلا نسخة واحدة من كل مادة.
      </p>

      <div className="g12-choice-group">
        <h4>لغة الدراسة</h4>
        <div className="g12-choice-grid">
          {STUDY_LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.code}
              type="button"
              data-testid={`${testIdPrefix}-study-language-${option.code}`}
              className={
                choices.studyLanguage === option.code ? "g12-choice-btn g12-choice-btn--on" : "g12-choice-btn"
              }
              aria-pressed={choices.studyLanguage === option.code}
              onClick={() => onChange({ studyLanguage: option.code as StudyLanguage })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="g12-choice-group">
        <h4>اللغة الأجنبية الأولى</h4>
        <div className="g12-choice-grid">
          {FIRST_LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.code}
              type="button"
              data-testid={`${testIdPrefix}-first-language-${option.code}`}
              className={
                choices.firstForeignLanguage === option.code
                  ? "g12-choice-btn g12-choice-btn--on"
                  : "g12-choice-btn"
              }
              aria-pressed={choices.firstForeignLanguage === option.code}
              onClick={() => chooseFirst(option.code)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="g12-choice-group">
        <h4>اللغة الأجنبية الثانية</h4>
        <div className="g12-choice-grid">
          {secondLanguageOptions(choices.firstForeignLanguage).map((option) => (
            <button
              key={option.code}
              type="button"
              data-testid={`${testIdPrefix}-second-language-${option.code}`}
              className={
                choices.secondForeignLanguage === option.code
                  ? "g12-choice-btn g12-choice-btn--on"
                  : "g12-choice-btn"
              }
              aria-pressed={choices.secondForeignLanguage === option.code}
              onClick={() => onChange({ secondForeignLanguage: option.code as SecondForeignLanguage })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="g12-choice-group">
        <h4>كتاب التربية الدينية</h4>
        <div className="g12-choice-grid">
          {RELIGION_OPTIONS.map((option) => (
            <button
              key={option.code}
              type="button"
              data-testid={`${testIdPrefix}-religion-${option.code}`}
              className={
                choices.religion === option.code ? "g12-choice-btn g12-choice-btn--on" : "g12-choice-btn"
              }
              aria-pressed={choices.religion === option.code}
              onClick={() => onChange({ religion: option.code as ReligionChoice })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
