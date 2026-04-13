import type { ReactNode } from "react";

type ParticipantShellProps = {
  children: ReactNode;
};

export function ParticipantShell({ children }: ParticipantShellProps) {
  return (
    <div className="participant-shell min-h-screen">
      <div className="participant-grid flex min-h-screen flex-col px-4 py-4 sm:px-6 sm:py-6">
        <header className="participant-brand-bar">
          <div className="logo-slot">DGI logo</div>
          <p className="kicker">Indoor Cycling Prøve</p>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
