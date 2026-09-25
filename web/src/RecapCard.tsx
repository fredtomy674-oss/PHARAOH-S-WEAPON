import type { SessionRecap } from "./api.js";

/**
 * PHASE 29 (D-027) — renders a safe session recap. Shared by the student
 * (Home) and the parent (Parent); both read the SAME metadata-only payload,
 * so what a parent sees is exactly what the student sees — never message
 * content.
 */
export function SessionRecapCard({ recap, testIdPrefix = "" }: { recap: SessionRecap; testIdPrefix?: string }) {
  return (
    <div className="recap-panel" data-testid={`${testIdPrefix}session-recap`}>
      <p className="recap-headline" data-testid={`${testIdPrefix}recap-headline`}>
        {recap.headline}
      </p>
      <p className="muted" data-testid={`${testIdPrefix}recap-focus`}>
        {recap.focus}
      </p>
      <p className="muted" data-testid={`${testIdPrefix}recap-stats`}>
        {recap.userMessages} رسالة منك · {recap.tutorMessages} ردّ المعلّم · {recap.durationMinutes} دقيقة
        {recap.attachmentCount > 0 ? ` · ${recap.attachmentCount} مرفق` : ""}
      </p>
      {recap.concepts.length > 0 && (
        <ul className="progress-list">
          {recap.concepts.map((c) => (
            <li key={c.title} className="progress-row">
              <span>{c.title}</span>
              <span className="muted">
                {c.correct}/{c.attempts} إجابات صحيحة
              </span>
            </li>
          ))}
        </ul>
      )}
      {recap.strengths.length > 0 && (
        <div>
          <b>ما الذي أحرزته؟</b>
          <ul data-testid={`${testIdPrefix}recap-strengths`}>
            {recap.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {recap.suggestions.length > 0 && (
        <div>
          <b>اقتراحاتي</b>
          <ul data-testid={`${testIdPrefix}recap-suggestions`}>
            {recap.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {recap.fallback && (
        <p className="muted" data-testid={`${testIdPrefix}recap-fallback`}>
          ملخص تلقائي مبني على بيانات الجلسة.
        </p>
      )}
    </div>
  );
}