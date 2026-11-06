/** Site-wide footer. Rendered in the root layout so it appears on every page. */
export default function Disclaimer() {
  return (
    <footer className="no-print mx-auto w-full max-w-7xl px-5 pb-24 pt-2 text-center text-xs leading-relaxed text-ink/60 md:px-8 md:pb-8 md:pt-6">
      <p className="font-medium text-ink/70">Not a diagnosis.</p>
      <p className="mx-auto max-w-2xl">
        Cyster shares general information to help you prepare for a conversation with a doctor. It
        can&apos;t diagnose or treat anything. If something feels urgent, contact a doctor or your
        local emergency number.
      </p>
    </footer>
  );
}
