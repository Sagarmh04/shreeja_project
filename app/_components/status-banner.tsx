type StatusBannerProps = {
  tone?: "error" | "success";
  message?: string;
};

export function StatusBanner({
  tone = "error",
  message,
}: StatusBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={
        tone === "success"
          ? "rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          : "rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
      }
    >
      {message}
    </div>
  );
}
