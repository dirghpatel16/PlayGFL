import { PreferredRole } from "@/lib/types/models";

export interface EditableProfile {
  bgmi_name?: string | null;
  bgmi_id?: string | null;
  preferred_roles?: PreferredRole[] | null;
}

const required: (keyof EditableProfile)[] = ["bgmi_name", "bgmi_id", "preferred_roles"];

export function completionPercent(profile: EditableProfile) {
  let filled = 0;
  for (const key of required) {
    const value = profile[key];
    if (Array.isArray(value) && value.length > 0) filled += 1;
    else if (typeof value === "string" && value.trim()) filled += 1;
  }
  return Math.round((filled / required.length) * 100);
}
