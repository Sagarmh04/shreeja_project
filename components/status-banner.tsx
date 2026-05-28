type StatusBannerProps = {
  status?: string;
  message?: string;
};

export function StatusBanner({ status, message }: StatusBannerProps) {
  if (!message) {
    return null;
  }

  const isError = status === "error";

  return (
    <div
      className={`rounded-3xl border px-4 py-3 text-sm ${
        isError
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {message}
    </div>
  );
}
