type SetupNoticeProps = {
  title?: string;
  message: string;
};

export function SetupNotice({
  title = "Project setup still needs a few keys",
  message,
}: SetupNoticeProps) {
  return (
    <div className="rounded-[28px] border border-amber-300/60 bg-amber-50/90 p-6 text-amber-950 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
        Setup notice
      </p>
      <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-amber-900/80">
        {message}
      </p>
    </div>
  );
}
