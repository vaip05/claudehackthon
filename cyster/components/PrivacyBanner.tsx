'use client';

import { useEffect, useState } from 'react';
import { WIPE_EVENT, hasSeenBanner, markBannerSeen } from '@/lib/storage';

/**
 * First-visit privacy note. Dismissal is stored under `cyster.seenBanner`, so
 * "Delete everything" (wipeAll) brings it back, like a fresh install.
 *
 * Wording is deliberately precise: the cycle log stays on the device, but the
 * chat, attachments and a short cycle summary DO leave it, because the AI runs
 * on a server. Do not shorten this to "nothing is stored" or "only your chat is sent".
 */
export default function PrivacyBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // localStorage is only available in the browser, so read it after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- avoids a hydration mismatch
    setShow(!hasSeenBanner());
    const onWipe = () => setShow(true);
    window.addEventListener(WIPE_EVENT, onWipe);
    return () => window.removeEventListener(WIPE_EVENT, onWipe);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    markBannerSeen();
    setShow(false);
  };

  return (
    <div className="no-print mx-auto w-full max-w-7xl px-5 md:px-8">
    <section
      role="region"
      aria-label="Privacy"
      className="mb-2 mt-1 rounded-2xl border border-lavender-soft bg-lavender-soft/50 p-4 md:mt-0 md:p-5"
    >
      <div className="flex items-start gap-3">
        <svg
          viewBox="0 0 24 24"
          className="mt-0.5 h-5 w-5 shrink-0 text-lavender-deep"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        <div className="flex-1 text-sm leading-relaxed text-ink/80">
          <p className="font-semibold text-ink">Your privacy</p>
          <p className="mt-1">
            Your cycle log and account stay on this device. When you chat, your messages, any files
            you attach and a short summary of your log are sent to an AI service to write replies.
            We have no server database, so we never receive your email or password.
          </p>
          <button
            onClick={dismiss}
            className="mt-3 rounded-full bg-lavender-deep px-4 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
          >
            Got it
          </button>
        </div>
      </div>
    </section>
    </div>
  );
}
