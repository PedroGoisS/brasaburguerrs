import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { DeliverySettings } from "./DeliverySettings";
import { defaultDelivery, validateDelivery } from "@/lib/delivery";
import { WEEKDAYS, setState, useStore, type DayHours, type Settings } from "@/lib/store";

export function StoreSettings() {
  const { settings } = useStore();
  const [draft, setDraft] = useState<Settings>(() => structuredClone({ ...settings, delivery: settings.delivery ?? defaultDelivery }));
  const [message, setMessage] = useState("");
  const updateDay = (index: number, day: DayHours) => setDraft((s) => ({ ...s, hours: s.hours.map((h, i) => i === index ? day : h) }));

  return <form className="space-y-6" onSubmit={(e) => {
    e.preventDefault();
    const deliveryError = validateDelivery(draft.delivery ?? defaultDelivery);
    if (deliveryError) { setMessage(deliveryError); return; }
    if (draft.hours.some((h) => !h.closed && (!h.shifts.length || h.shifts.some((sh, i) => sh.open >= sh.close || (i > 0 && sh.open < h.shifts[i - 1].close))))) {
      setMessage("Confira os horários: a abertura deve ser antes do fechamento, sem sobreposição de turnos.");
      return;
    }
    setState((s) => ({ ...s, settings: { ...draft, name: draft.name.trim() } }));
    setMessage("Configurações salvas.");
  }}>
    <h1 className="text-3xl font-extrabold">Loja</h1>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Nome da loja"><input className="field" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
      <Field label="Logo (URL)"><input className="field" type="url" value={draft.logo} onChange={(e) => setDraft({ ...draft, logo: e.target.value })} /></Field>
      <Field label="WhatsApp"><input className="field" inputMode="tel" required value={draft.whatsapp} onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value.replace(/\D/g, "") })} /></Field>
      <Field label="Instagram"><input className="field" value={draft.instagram} onChange={(e) => setDraft({ ...draft, instagram: e.target.value })} /></Field>
      <Field label="Pedido mínimo (R$)"><input className="field" type="number" min="0" step="0.01" required value={draft.minOrder} onChange={(e) => setDraft({ ...draft, minOrder: Number(e.target.value) })} /></Field>
      <Field label="Tempo de entrega"><input className="field" value={draft.deliveryTime} onChange={(e) => setDraft({ ...draft, deliveryTime: e.target.value })} /></Field>
      <Field label="Endereço do estabelecimento"><input className="field" required minLength={10} maxLength={250} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></Field>
    </div>
    <Field label="Áreas atendidas"><textarea className="field" value={draft.areas} onChange={(e) => setDraft({ ...draft, areas: e.target.value })} /></Field>
    <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={draft.pickup} onChange={(e) => setDraft({ ...draft, pickup: e.target.checked })} />Retirada no local</label>
    <section className="space-y-3">
      <h2 className="text-xl font-bold">Horários de funcionamento</h2>
      {draft.hours.map((day, index) => <div key={index} className="space-y-2 border-b py-3">
        <div className="flex flex-wrap items-center gap-4"><h3 className="w-24 font-bold">{WEEKDAYS[index]}</h3><label className="flex items-center gap-2"><input type="checkbox" checked={day.closed} onChange={(e) => updateDay(index, { ...day, closed: e.target.checked })} />Fechado</label>
          {!day.closed && <Button variant="ghost" onClick={() => updateDay(index, { ...day, shifts: [...day.shifts, { open: "18:00", close: "23:00" }] })}><Plus className="h-4 w-4" />Turno</Button>}
        </div>
        {!day.closed && day.shifts.map((shift, i) => <div key={i} className="flex flex-wrap items-end gap-2">
          <Field label="Abertura"><input aria-label={`Abertura ${WEEKDAYS[index]} turno ${i + 1}`} className="field" type="time" required value={shift.open} onChange={(e) => updateDay(index, { ...day, shifts: day.shifts.map((sh, j) => j === i ? { ...sh, open: e.target.value } : sh) })} /></Field>
          <Field label="Fechamento"><input aria-label={`Fechamento ${WEEKDAYS[index]} turno ${i + 1}`} className="field" type="time" required value={shift.close} onChange={(e) => updateDay(index, { ...day, shifts: day.shifts.map((sh, j) => j === i ? { ...sh, close: e.target.value } : sh) })} /></Field>
          <Button variant="ghost" className="w-11 p-0 text-destructive" title="Remover turno" aria-label={`Remover turno ${i + 1} de ${WEEKDAYS[index]}`} onClick={() => updateDay(index, { ...day, shifts: day.shifts.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
        </div>)}
      </div>)}
    </section>
    <DeliverySettings value={draft.delivery ?? defaultDelivery} onChange={(delivery) => setDraft({ ...draft, delivery })} />
    {message && <p role="status" className="font-semibold">{message}</p>}
    <Button type="submit"><Save className="h-4 w-4" />Salvar configurações</Button>
  </form>;
}