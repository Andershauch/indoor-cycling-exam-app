import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";

type ParticipantShellProps = {
  children: ReactNode;
};

export function ParticipantShell({ children }: ParticipantShellProps) {
  return (
    <div className="participant-shell min-h-screen">
      <div className="participant-grid flex min-h-screen flex-col px-4 py-4 sm:px-6 sm:py-6">
        <header className="participant-brand-bar">
          <BrandLogo />
          <p className="kicker">Indoor Cycling Prøve</p>
        </header>
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
