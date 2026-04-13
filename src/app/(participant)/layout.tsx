import type { ReactNode } from "react";

import { ParticipantShell } from "@/components/participant/participant-shell";

export default function ParticipantLayout({ children }: { children: ReactNode }) {
  return <ParticipantShell>{children}</ParticipantShell>;
}
