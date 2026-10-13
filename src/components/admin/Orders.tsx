import { useState } from "react";
import { STATUSES, brNow, brl, setState, useStore, type OrderStatus } from "@/lib/store";

export function Orders() {
  const { orders } = useStore();
  const [date, setDate] = useState(() => brNow().date);
  const [st, setSt] = useState<"Todos" | OrderStatus>("Todos");
  const list = orders.filter((o) => (!date || brNow(new Date(o.createdAt)).date === date) && (st === "Todos" || o.status === st));
  const update = (id: string, status: OrderStatus) => setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) }));

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Pedidos</h1>
      <div className="flex flex-wrap gap-3">
        <label className="text-sm font-semibold">Data <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="text-sm font-semibold">Status
          <select className="field" value={st} onChange={(e) => setSt(e.target.value as typeof st)}>
            <option>Todos</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <button className="btn-ghost self-end" onClick={() => setDate("")}>Todas as datas</button>
      </div>
      {list.length === 0 && <p className="text-muted-foreground">Nenhum pedido encontrado.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {list.slice(0, 100).map((o) => (
          <article key={o.id} className="rounded-2xl bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold">{o.customer} · <span className="text-primary">{brl(o.total)}</span></p>
                <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · {o.payment} · {o.pickup ? "Retirada" : "Entrega"}</p>
                {o.scheduledFor && <p className="text-xs font-bold text-primary">Agendado: {o.scheduledFor.replace("T", " ")}</p>}
              </div>
              <select aria-label="Status do pedido" className="field w-auto min-h-10 text-sm" value={o.status} onChange={(e) => update(o.id, e.target.value as OrderStatus)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
             <ul className="mt-2 text-sm">{o.items.map((i, k) => <li key={k}>{i.qty}x {i.name} · {brl(i.price * i.qty)}{i.extras?.map((e) => <p key={e.id} className="break-words pl-3 text-xs text-muted-foreground">+ {e.qty}x {e.name} por unidade · {brl(e.price * e.qty)}</p>)}</li>)}</ul>
            {o.notes && <p className="mt-1 text-sm italic">Obs.: {o.notes}</p>}
            {!o.pickup && o.address && <p className="mt-1 text-sm text-muted-foreground">{o.address} · {o.phone}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
