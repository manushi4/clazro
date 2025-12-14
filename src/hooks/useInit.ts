import { useEffect, useState } from "react";
import { initI18n } from "../i18n";

export function useInit() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initI18n();
        setReady(true);
      } catch {
        // Still set ready to true so app can render
        setReady(true);
      }
    })();
  }, []);

  return ready;
}
