import { useMemo, useState } from "react";
import { Download, TrendingDown, TrendingUp } from "lucide-react";
import { PAYMENTS, WEEKDAYS, brNow, brl, useStore, type Order } from "@/lib/store";

const shift = (date: string, n: number) => { const d = new Date(date + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const diffDays = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const oDate = (o: Order) => brNow(new Date(o.createdAt)).date;
const valid = (o: Order) => o.status !== "Cancelado";

function inRange(orders: Order[], a: string, b: string) { return orders.filter((o) => { const d = oDate(o); return valid(o) && d >= a && d <= b; }); }
function summary(orders: Order[]) {
  const total = orders.reduce((s, o) => s + o.total, 0);
  return { total, count: orders.length, avg: orders.length ? total / orders.length : 0 };
}
function topProducts(orders: Order[]) {
  const m = new Map<string, { name: string; qty: number; revenue: number }>();
  orders.forEach((o) => o.items.forEach((i) => { const c = m.get(i.name) ?? { name: i.name, qty: 0, revenue: 0 }; c.qty += i.qty; c.revenue += i.qty * i.price; m.set(i.name, c); }));
  return [...m.values()].sort((a, b) => b.qty - a.qty);
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return <div className="rounded-2xl bg-card p-5"><p className="text-sm font-semibold text-muted-foreground">{label}</p><p className="font-display text-3xl font-extrabold">{value}</p>{sub}</div>;
}

function Bars({ data }: { data: { label: string; value: number; display?: string }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-48 items-end gap-1 overflow-x-auto">
      {data.map((d, i) => (
        <div key={i} className="flex min-w-6 flex-1 flex-col items-center gap-1" title={`${d.label}: ${d.display ?? d.value}`}>
          <div className="w-full rounded-t-md bg-primary" style={{ height: `${(d.value / max) * 160}px` }} />
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Overview() {
  const { orders } = useStore();
  const today = brNow().date;
  const list = inRange(orders, today, today);
  const s = summary(list);
  const top = topProducts(list).slice(0, 5);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Resumo de hoje</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Pedidos do dia" value={String(s.count)} />
        <Stat label="Faturamento do dia" value={brl(s.total)} />
        <Stat label="Ticket médio" value={brl(s.avg)} />
      </div>
      <div className="rounded-2xl bg-card p-5">
        <h2 className="mb-3 text-xl font-bold">Mais vendidos hoje</h2>
        {top.length === 0 ? <p className="text-muted-foreground">Nenhuma venda hoje ainda.</p> : (
          <ol className="space-y-2">{top.map((p, i) => <li key={p.name} className="flex justify-between"><span><b className="text-primary">{i + 1}.</b> {p.name}</span><span>{p.qty} un.</span></li>)}</ol>
        )}
      </div>
    </div>
  );
}

const PRESETS = ["Hoje", "Ontem", "Últimos 7 dias", "Este mês", "Mês passado", "Este ano", "Personalizado"] as const;

export function Reports() {
  const { orders } = useStore();
  const today = brNow().date;
  const [preset, setPreset] = useState<(typeof PRESETS)[number]>("Últimos 7 dias");
  const [custom, setCustom] = useState({ a: shift(today, -30), b: today });

  const [a, b] = useMemo<[string, string]>(() => {
    const y = today.slice(0, 4), m = today.slice(5, 7);
    switch (preset) {
      case "Hoje": return [today, today];
      case "Ontem": return [shift(today, -1), shift(today, -1)];
      case "Últimos 7 dias": return [shift(today, -6), today];
      case "Este mês": return [`${y}-${m}-01`, today];
      case "Mês passado": { const end = shift(`${y}-${m}-01`, -1); return [end.slice(0, 8) + "01", end]; }
      case "Este ano": return [`${y}-01-01`, today];
      default: return [custom.a, custom.b];
    }
  }, [preset, custom, today]);

  const invalid = a > b;
  const list = invalid ? [] : inRange(orders, a, b);
  const len = diffDays(a, b) + 1;
  const prev = inRange(orders, shift(a, -len), shift(a, -1));
  const s = summary(list), ps = summary(prev);
  const pct = ps.total ? ((s.total - ps.total) / ps.total) * 100 : null;
  const byPay = PAYMENTS.map((p) => ({ p, v: list.filter((o) => o.payment === p).reduce((x, o) => x + o.total, 0) }));
  const days: { label: string; value: number; display: string }[] = [];
  if (!invalid && len <= 400) for (let d = a; d <= b; d = shift(d, 1)) { const v = list.filter((o) => oDate(o) === d).reduce((x, o) => x + o.total, 0); days.push({ label: `${d.slice(8)}/${d.slice(5, 7)}`, value: v, display: brl(v) }); }
  const hours = Array.from({ length: 24 }, (_, h) => ({ label: `${h}h`, value: list.filter((o) => Math.floor(brNow(new Date(o.createdAt)).minutes / 60) === h).length })).filter((x, i) => i >= 10 || x.value);
  const wds = WEEKDAYS.map((w, i) => ({ label: w.slice(0, 3), value: list.filter((o) => brNow(new Date(o.createdAt)).weekday === i).length }));
  const top = topProducts(list);

  const exportCsv = () => {
    const rows = [["Data", "Cliente", "Pagamento", "Status", "Itens", "Total"], ...list.map((o) => [new Date(o.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), o.customer, o.payment, o.status, o.items.map((i) => `${i.qty}x ${i.name}`).join(" | "), o.total.toFixed(2).replace(".", ",")])];
    const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const el = document.createElement("a"); el.href = url; el.download = `faturamento_${a}_${b}.csv`; el.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Faturamento</h1>
        <button className="btn-ghost" onClick={exportCsv} disabled={!list.length}><Download className="h-4 w-4" /> Exportar CSV</button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PRESETS.map((p) => <button key={p} onClick={() => setPreset(p)} className={`whitespace-nowrap ${preset === p ? "btn" : "btn-ghost"}`}>{p}</button>)}
      </div>
      {preset === "Personalizado" && (
        <div className="flex flex-wrap gap-3">
          <label className="text-sm font-semibold">De <input type="date" className="field" value={custom.a} onChange={(e) => setCustom({ ...custom, a: e.target.value })} /></label>
          <label className="text-sm font-semibold">Até <input type="date" className="field" value={custom.b} onChange={(e) => setCustom({ ...custom, b: e.target.value })} /></label>
          {invalid && <p role="alert" className="self-end font-semibold text-destructive">A data final deve ser depois da inicial.</p>}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Faturamento total" value={brl(s.total)} sub={pct !== null && (
          <p className={`mt-1 flex items-center gap-1 text-sm font-bold ${pct >= 0 ? "text-success" : "text-destructive"}`}>{pct >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}{pct.toFixed(1)}% vs. período anterior</p>
        )} />
        <Stat label="Pedidos" value={String(s.count)} />
        <Stat label="Ticket médio" value={brl(s.avg)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {byPay.map((x) => <Stat key={x.p} label={x.p} value={brl(x.v)} />)}
      </div>
      <div className="rounded-2xl bg-card p-5"><h2 className="mb-3 text-xl font-bold">Faturamento por dia</h2><Bars data={days} /></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-card p-5"><h2 className="mb-3 text-xl font-bold">Pedidos por horário</h2><Bars data={hours} /></div>
        <div className="rounded-2xl bg-card p-5"><h2 className="mb-3 text-xl font-bold">Pedidos por dia da semana</h2><Bars data={wds} /></div>
      </div>
      <div className="rounded-2xl bg-card p-5">
        <h2 className="mb-3 text-xl font-bold">Ranking de produtos</h2>
        {top.length === 0 ? <p className="text-muted-foreground">Sem vendas no período.</p> : (
          <table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-2">#</th><th>Produto</th><th className="text-right">Qtd.</th><th className="text-right">Receita</th></tr></thead>
            <tbody>{top.map((p, i) => <tr key={p.name} className="border-b"><td className="py-2 font-bold text-primary">{i + 1}</td><td>{p.name}</td><td className="text-right">{p.qty}</td><td className="text-right">{brl(p.revenue)}</td></tr>)}</tbody></table>
        )}
      </div>
    </div>
  );
}
