export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
      {error && <span role="alert" className="mt-1 block text-sm font-semibold text-destructive">{error}</span>}
    </label>
  );
}
