/** İstemci ve sunucuda ortak: okur bildirimi nedenleri. */
export const REPORT_REASONS = [
  { value: "yanlis", label: "Yanlış bilgi" },
  { value: "sahte", label: "Sahte / uydurma içerik" },
  { value: "telif", label: "Telif ihlali" },
  { value: "uygunsuz", label: "Uygunsuz içerik" },
  { value: "diger", label: "Diğer" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

export function isReportReason(value: unknown): value is ReportReason {
  return REPORT_REASONS.some((r) => r.value === value);
}

export function reportReasonLabel(value: string): string {
  return REPORT_REASONS.find((r) => r.value === value)?.label ?? value;
}
