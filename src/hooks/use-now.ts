import { useEffect, useState } from "react";

/** Atualiza a cada minuto (alinhado à virada do minuto). */
export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const tick = () => { setNow(new Date()); t = setTimeout(tick, 60000 - (Date.now() % 60000) + 50); };
    t = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
    return () => clearTimeout(t);
  }, []);
  return now;
}
