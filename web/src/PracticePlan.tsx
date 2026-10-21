import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
  type PracticePlanItem,
  type StudentTask,
  type StudentTaskKind,
  type Subject,
} from "./api.js";
import { addDaysISO, arabicLongDate, arabicWeekday, dueLabel, localISODate } from "./dates.js";
import { needsGeneration, planPageText, planReason, trendArrow } from "./planMeta.js";

interface Props {
  /** `null` while the full plan is loading; `[]` means a real empty plan. */
  plan: PracticePlanItem[] | null;
  planError: string | null;
  total: number;
  subjects: Subject[];
  onBack: () => void;
  onPractice: (conceptId: string, mode: "mcq" | "open", generate: boolean) => void;
  onTasksChanged: () => void;
}

function PlanRow({
  item,
  step,
  onPractice,
}: {
  item: PracticePlanItem;
  step: number;
  onPractice: Props["onPractice"];
}) {
  const generate = needsGeneration(item, "mcq");
  const page = planPageText(item);
  return (
    <li className="pl-row" data-testid="plan-row" data-concept-id={item.conceptId}>
      <div className="pl-row__head">
        <span className="pl-row__step" aria-hidden="true">
          {step}
        </span>
        <strong className="pl-row__title">{item.title}</strong>
        <span className={item.level === "mastered" || item.level === "advanced" ? "pl-chip pl-chip--ok" : "pl-chip"} data-testid="plan-level">
          {item.labelAr}
        </span>
        {item.dueForReview && (
          <span className="pl-chip pl-chip--warn" data-testid="plan-due">
            راجع قبل أن تنسى
          </span>
        )}
      </div>
      <p className="pl-row__reason" data-testid="plan-reason">
        {planReason(item)}
      </p>
      <div className="pl-row__meta" data-testid="plan-meta">
        <span data-testid="plan-lesson">{item.lessonTitle ?? "درسك"}</span>
        {page && (
          <>
            <span aria-hidden="true">·</span>
            <span data-testid="plan-page">{page}</span>
          </>
        )}
        <span aria-hidden="true">·</span>
        <span data-testid="plan-questions">{item.availableQuestions} سؤال متاح</span>
        <span aria-hidden="true">·</span>
        <span data-testid="plan-trend" title="اتجاه إتقانك">
          {trendArrow(item.trend)}
        </span>
      </div>
      <div className="pl-row__actions">
        <button
          type="button"
          className="pl-btn pl-btn--primary"
          data-testid={generate ? "plan-generate" : "plan-practice"}
          onClick={() => onPractice(item.conceptId, "mcq", generate)}
        >
          تدرّب الآن
        </button>
        <button
          type="button"
          className="pl-btn pl-btn--ghost"
          data-testid={item.openQuestions > 0 ? "plan-open-practice" : "plan-open-generate"}
          onClick={() => onPractice(item.conceptId, "open", item.openQuestions === 0)}
        >
          سؤال مقالي
        </button>
      </div>
    </li>
  );
}

function TaskRow({
  task,
  subjectName,
  busy,
  onToggle,
  onDelete,
  today,
}: {
  task: StudentTask;
  subjectName: string | null;
  busy: boolean;
  onToggle: (task: StudentTask) => void;
  onDelete: (task: StudentTask) => void;
  today: string;
}) {
  return (
    <li className="pl-task" data-testid="task-row" data-task-id={task.id} data-done={task.done ? "1" : "0"}>
      <button
        type="button"
        className={task.done ? "pl-task__check pl-task__check--done" : "pl-task__check"}
        data-testid="task-toggle"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? `إعادة ${task.title} إلى المهام` : `إنجاز ${task.title}`}
        disabled={busy}
        onClick={() => onToggle(task)}
      >
        {task.done ? "✓" : ""}
      </button>
      <div className="pl-task__body">
        <strong className={task.done ? "pl-task__title pl-task__title--done" : "pl-task__title"}>{task.title}</strong>
        <span className="pl-task__meta">
          <span>{task.kind === "exam" ? "📝 امتحان" : "📚 واجب"}</span>
          {subjectName && <span>· {subjectName}</span>}
          <span>· {dueLabel(task.dueDate, today)}</span>
        </span>
      </div>
      <button type="button" className="pl-task__delete" data-testid="task-delete" disabled={busy} onClick={() => onDelete(task)}>
        حذف
      </button>
    </li>
  );
}

/**
 * PHASE 182 — «أسبوعي»: the whole practice plan lives here, not on Home.
 *
 * The top three rows are a day-sized priority list. Everything else is grouped
 * by subject as a short index, expanded per subject, so 569 concepts can exist
 * without becoming a wall. Homework/exams are the child's own rows, stored in
 * `student_tasks` and scoped to the active child.
 */
export function PracticePlanScreen({ plan, planError, total, subjects, onBack, onPractice, onTasksChanged }: Props) {
  const today = localISODate();
  const [tasks, setTasks] = useState<StudentTask[] | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskBusy, setTaskBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<StudentTaskKind>("homework");
  const [dueDate, setDueDate] = useState(today);
  const [subjectId, setSubjectId] = useState("");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const refreshTasks = useCallback(async () => {
    try {
      const rows = await listTasks();
      setTasks(rows);
      setTaskError(null);
    } catch {
      setTasks([]);
      setTaskError("تعذر تحميل واجباتك الآن — حاول مرة أخرى.");
    }
  }, []);

  useEffect(() => {
    void refreshTasks();
  }, [refreshTasks]);

  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysISO(today, i)), [today]);
  const pending = useMemo(() => (tasks ?? []).filter((t) => !t.done), [tasks]);
  const overdue = useMemo(() => pending.filter((t) => t.dueDate < today), [pending, today]);
  const visibleTasks = useMemo(
    () =>
      (tasks ?? [])
        .filter((t) => {
          if (!showDone && t.done) return false;
          if (selectedDay) return t.dueDate === selectedDay;
          // Open tasks are "upcoming"; once the child asks for completed work,
          // past completed rows belong in that view too.
          return showDone || t.dueDate >= today;
        })
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.createdAt.localeCompare(b.createdAt)),
    [tasks, showDone, selectedDay, today],
  );

  const groups = useMemo(() => {
    const map = new Map<string, PracticePlanItem[]>();
    for (const item of (plan ?? []).slice(3)) {
      const key = item.subjectNameAr ?? "مواد أخرى";
      const list = map.get(key);
      if (list) list.push(item);
      else map.set(key, [item]);
    }
    return [...map.entries()];
  }, [plan]);

  const subjectName = (id: string | null): string | null => subjects.find((s) => s.id === id)?.nameAr ?? null;

  async function submitTask(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (taskBusy) return;
    if (title.trim().length < 2) {
      setTaskError("اكتب اسم الواجب أو الامتحان أولًا.");
      return;
    }
    setTaskBusy(true);
    setTaskError(null);
    try {
      await createTask({
        title: title.trim(),
        kind,
        dueDate,
        subjectId: subjectId || null,
      });
      setTitle("");
      setKind("homework");
      setDueDate(today);
      setSubjectId("");
      setAdding(false);
      setSelectedDay(null);
      await refreshTasks();
      onTasksChanged();
    } catch {
      setTaskError("تعذر حفظ المهمة — حاول مرة أخرى.");
    } finally {
      setTaskBusy(false);
    }
  }

  async function toggleTask(task: StudentTask): Promise<void> {
    if (taskBusy) return;
    setTaskBusy(true);
    try {
      await updateTask(task.id, { done: !task.done });
      await refreshTasks();
      onTasksChanged();
    } catch {
      setTaskError("تعذر تحديث المهمة.");
    } finally {
      setTaskBusy(false);
    }
  }

  async function removeTask(task: StudentTask): Promise<void> {
    if (taskBusy) return;
    if (!window.confirm(`حذف «${task.title}» من مهامك؟`)) return;
    setTaskBusy(true);
    try {
      await deleteTask(task.id);
      await refreshTasks();
      onTasksChanged();
    } catch {
      setTaskError("تعذر حذف المهمة.");
    } finally {
      setTaskBusy(false);
    }
  }

  const priority = (plan ?? []).slice(0, 3);
  const allExpanded = groups.length > 0 && groups.every(([subject]) => expandedGroups.has(subject));

  return (
    <div className="pl-layout">
      <main className="pl-main" data-testid="plan-screen">
        <div className="pl-topbar">
          <button type="button" className="pl-back" data-testid="plan-screen-back" onClick={onBack}>
            <span aria-hidden="true">→</span> عودة للرئيسية
          </button>
          <span className="pl-topbar__hint">خطة الأسبوع</span>
        </div>

        <header className="pl-hero">
          <div>
            <h2>أسبوعك معي</h2>
            <p>خطة ممارسة من إجاباتك الحقيقية، وواجباتك وامتحاناتك في مكان واحد.</p>
          </div>
          <div className="pl-hero__chips">
            <span className="pl-chip pl-chip--ok">{total} مفهومًا في خطتك</span>
            <span className="pl-chip">3 خطوات اليوم</span>
          </div>
        </header>

        <section className="pl-card pl-tasks" data-testid="tasks-section">
          <div className="pl-card__head">
            <div>
              <h3>مهامي وامتحاناتي</h3>
              <p>أضف ما عليك، وسنذكّرك به في يومه.</p>
            </div>
            <button type="button" className="pl-btn pl-btn--primary" data-testid="task-add-toggle" onClick={() => setAdding((v) => !v)}>
              {adding ? "إلغاء" : "+ أضف مهمة"}
            </button>
          </div>

          <div className="pl-week" data-testid="week-strip" role="group" aria-label="أيام الأسبوع القادم">
            {week.map((day) => {
              const count = pending.filter((t) => t.dueDate === day).length;
              const selected = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  className={selected ? "pl-week__day pl-week__day--on" : "pl-week__day"}
                  data-testid="week-day"
                  data-date={day}
                  data-today={day === today ? "1" : "0"}
                  aria-pressed={selected}
                  onClick={() => setSelectedDay(selected ? null : day)}
                >
                  <span>{day === today ? "اليوم" : arabicWeekday(day)}</span>
                  <b>{Number(day.slice(8, 10))}</b>
                  {count > 0 && <i aria-label={`${count} مهمة`}>{count}</i>}
                </button>
              );
            })}
          </div>

          {adding && (
            <form className="pl-task-form" data-testid="task-form" onSubmit={(e) => void submitTask(e)}>
              <label className="pl-field pl-field--wide">
                <span>المهمة</span>
                <input
                  data-testid="task-title"
                  value={title}
                  maxLength={120}
                  placeholder="مثال: حل تمارين صفحة ٤٢"
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              <label className="pl-field">
                <span>النوع</span>
                <select data-testid="task-kind" value={kind} onChange={(e) => setKind(e.target.value as StudentTaskKind)}>
                  <option value="homework">واجب</option>
                  <option value="exam">امتحان</option>
                </select>
              </label>
              <label className="pl-field">
                <span>اليوم</span>
                <input data-testid="task-date" type="date" min={today} value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
              </label>
              <label className="pl-field">
                <span>المادة (اختياري)</span>
                <select data-testid="task-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                  <option value="">بدون مادة</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameAr}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="pl-btn pl-btn--primary" data-testid="task-submit" disabled={taskBusy}>
                {taskBusy ? "…" : "أضف المهمة"}
              </button>
            </form>
          )}

          {taskError && (
            <p className="pl-error" data-testid="task-error" role="alert">
              {taskError}
            </p>
          )}

          {overdue.length > 0 && (
            <div className="pl-overdue">
              <h4>⚠️ متأخر</h4>
              <ul className="pl-task-list">
                {overdue.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    subjectName={subjectName(task.subjectId)}
                    busy={taskBusy}
                    onToggle={(t) => void toggleTask(t)}
                    onDelete={(t) => void removeTask(t)}
                    today={today}
                  />
                ))}
              </ul>
            </div>
          )}

          <div className="pl-task-toolbar">
            <span>
              {selectedDay ? `مهام ${arabicLongDate(selectedDay)}` : showDone ? "كل المهام" : "كل المهام القادمة"}
              {tasks !== null &&
                ` · ${(selectedDay ? pending.filter((t) => t.dueDate === selectedDay) : pending).length} غير منجزة`}
            </span>
            <button type="button" className="pl-link" data-testid="tasks-show-all" onClick={() => setSelectedDay(null)}>
              كل الأيام
            </button>
            <button type="button" className="pl-link" data-testid="tasks-show-done" aria-pressed={showDone} onClick={() => setShowDone((v) => !v)}>
              {showDone ? "إخفاء المنجز" : "إظهار المنجز"}
            </button>
          </div>

          {tasks === null ? (
            <p className="pl-note" data-testid="tasks-loading">
              نجهّز مهامك…
            </p>
          ) : visibleTasks.length === 0 ? (
            <p className="pl-empty" data-testid="tasks-empty">
              لا مهام هنا بعد — أضف أول واجب أو امتحان من الزر بالأعلى.
            </p>
          ) : (
            <ul className="pl-task-list" data-testid="task-list">
              {visibleTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  subjectName={subjectName(task.subjectId)}
                  busy={taskBusy}
                  onToggle={(t) => void toggleTask(t)}
                  onDelete={(t) => void removeTask(t)}
                  today={today}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="pl-card pl-plan" data-testid="plan-screen-list">
          <div className="pl-card__head">
            <div>
              <h3>خطة الممارسة</h3>
              <p>الأضعف أولًا — كل صف يقول لماذا، ومن أي درس، وفي أي صفحة.</p>
            </div>
          </div>

          {planError ? (
            <p className="pl-error" data-testid="plan-screen-error" role="alert">
              {planError}
            </p>
          ) : plan === null ? (
            <p className="pl-note" data-testid="plan-screen-loading">
              نجهّز خطتك الكاملة…
            </p>
          ) : plan.length === 0 ? (
            <p className="pl-empty" data-testid="plan-screen-empty">
              لا توجد مفاهيم في خطتك بعد — ابدأ درسًا أو أجب عن تمرين.
            </p>
          ) : (
            <>
              <div className="pl-priority">
                <div className="pl-priority__head">
                  <h4>أولويات اليوم</h4>
                  <span>3 خطوات فقط</span>
                </div>
                <ul className="pl-plan-list">
                  {priority.map((item, i) => (
                    <PlanRow key={item.conceptId} item={item} step={i + 1} onPractice={onPractice} />
                  ))}
                </ul>
              </div>

              {groups.length > 0 && (
                <div className="pl-groups">
                  <div className="pl-groups__head">
                    <h4 className="pl-groups__title">باقي الخطة حسب المادة</h4>
                    <button
                      type="button"
                      className="pl-link"
                      data-testid="plan-expand-all"
                      aria-expanded={allExpanded}
                      onClick={() =>
                        setExpandedGroups(allExpanded ? new Set() : new Set(groups.map(([subject]) => subject)))
                      }
                    >
                      {allExpanded ? "اطوِ كل المواد" : "عرض كل الخطة"}
                    </button>
                  </div>
                  {groups.map(([subject, items]) => {
                    const expanded = expandedGroups.has(subject);
                    // PHASE 182 — subjects start as a short index, not 60 rows.
                    // «عرض الكل» is one button; a single subject opens on tap.
                    return (
                      <section key={subject} className="pl-group" data-testid="plan-group" data-subject={subject}>
                        <div className="pl-group__head">
                          <h5>{subject}</h5>
                          <span>{items.length} مفهومًا</span>
                          <button
                            type="button"
                            className="pl-link"
                            data-testid="plan-group-toggle"
                            aria-expanded={expanded}
                            onClick={() =>
                              setExpandedGroups((current) => {
                                const next = new Set(current);
                                if (next.has(subject)) next.delete(subject);
                                else next.add(subject);
                                return next;
                              })
                            }
                          >
                            {expanded ? "أقل" : `عرض ${items.length}`}
                          </button>
                        </div>
                        {expanded && (
                          <ul className="pl-plan-list">
                            {items.map((item, i) => (
                              <PlanRow key={item.conceptId} item={item} step={i + 1} onPractice={onPractice} />
                            ))}
                          </ul>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}

              <p className="pl-footnote">الخطة تُبنى من إجاباتك الحقيقية — كل تمرين يجعلها أذكى.</p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
