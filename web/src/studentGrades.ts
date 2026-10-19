import { listCountries, listGrades, listSystems, type Grade } from "./api.js";

/**
 * PHASE 180 — one source for the first-run / add-student / change-grade grade
 * cards. The MVP is Egypt-first (same choice FirstRun has always offered); the
 * server still validates every id, so this is only presentation.
 */
export async function listStudentGradeChoices(): Promise<Grade[]> {
  const countries = await listCountries();
  const egypt = countries.find((c) => c.nameAr === "مصر") ?? countries[0];
  if (!egypt) throw new Error("no countries");
  const systems = await listSystems(egypt.id);
  const firstSystem = systems[0];
  if (!firstSystem) throw new Error("no systems");
  return listGrades(firstSystem.id);
}
