import { STAGES, type StageId } from "../../content/schemas";
export function migrateStage(value: unknown): StageId | "legacy_serious" | null {
  if (value === "serious") return "legacy_serious";
  if (value === "early") return "getting_to_know";
  if (value === "mutual") return "mutual_crush";
  return typeof value === "string" && Object.hasOwn(STAGES, value) ? value as StageId : null;
}
