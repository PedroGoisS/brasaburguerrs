import { Plus, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { uid } from "@/lib/store";
import type { DeliverySettings as Config } from "@/lib/delivery";

export function DeliverySettings({ value, onChange }: { value: Config; onChange: (value: Config) => void }) {
  return <section className="space-y-4 border-t pt-6">
    <h2 className="flex items-center gap-2 text-xl font-bold"><Truck className="h-5 w-5" />Taxa de entrega</h2>
    <Field label="Modelo de cobrança"><select className="field" value={value.model} onChange={(e) => onChange({ ...value, model: e.target.value as Config["model"] })}><option value="km">Valor por km</option><option value="neighborhood">Valor por bairro</option><option value="ranges">Faixas de distância</option></select></Field>
    <Field label="Distância máxima de entrega (km)"><input className="field" type="number" min="0.1" max="500" step="0.1" placeholder="Sem limite" value={value.maxKm ?? ""} onChange={(e) => onChange({ ...value, maxKm: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
    {value.model === "km" && <Field label="Valor por km (R$)"><input className="field" type="number" required min="0" max="10000" step="0.01" value={value.perKm} onChange={(e) => onChange({ ...value, perKm: Number(e.target.value) })} /></Field>}
    {value.model === "neighborhood" && <div className="space-y-3">
      {value.neighborhoods.map((n, i) => <div key={n.id} className="grid grid-cols-[minmax(0,1fr)_100px_44px] items-end gap-2">
        <Field label="Bairro"><input aria-label={`Bairro ${i + 1}`} className="field" required maxLength={100} value={n.name} onChange={(e) => onChange({ ...value, neighborhoods: value.neighborhoods.map((x) => x.id === n.id ? { ...x, name: e.target.value } : x) })} /></Field>
        <Field label="Taxa (R$)"><input aria-label={`Taxa do bairro ${i + 1}`} className="field" type="number" required min="0" step="0.01" value={n.price} onChange={(e) => onChange({ ...value, neighborhoods: value.neighborhoods.map((x) => x.id === n.id ? { ...x, price: Number(e.target.value) } : x) })} /></Field>
        <Button variant="ghost" className="w-11 p-0 text-destructive" title="Remover bairro" aria-label={`Remover bairro ${i + 1}`} onClick={() => onChange({ ...value, neighborhoods: value.neighborhoods.filter((x) => x.id !== n.id) })}><Trash2 className="h-4 w-4" /></Button>
      </div>)}
      <Button variant="ghost" disabled={value.neighborhoods.length >= 100} onClick={() => onChange({ ...value, neighborhoods: [...value.neighborhoods, { id: uid(), name: "", price: 0 }] })}><Plus className="h-4 w-4" />Adicionar bairro</Button>
    </div>}
    {value.model === "ranges" && <div className="space-y-3">
      {value.ranges.map((r, i) => <div key={r.id} className="grid grid-cols-[repeat(3,minmax(0,1fr))_44px] items-end gap-2">
        <Field label="De (km)"><input aria-label={`Início da faixa ${i + 1}`} className="field" type="number" required min="0" step="0.1" value={r.from} onChange={(e) => onChange({ ...value, ranges: value.ranges.map((x) => x.id === r.id ? { ...x, from: Number(e.target.value) } : x) })} /></Field>
        <Field label="Até (km)"><input aria-label={`Fim da faixa ${i + 1}`} className="field" type="number" required min="0.1" step="0.1" value={r.to} onChange={(e) => onChange({ ...value, ranges: value.ranges.map((x) => x.id === r.id ? { ...x, to: Number(e.target.value) } : x) })} /></Field>
        <Field label="Taxa (R$)"><input aria-label={`Taxa da faixa ${i + 1}`} className="field" type="number" required min="0" step="0.01" value={r.price} onChange={(e) => onChange({ ...value, ranges: value.ranges.map((x) => x.id === r.id ? { ...x, price: Number(e.target.value) } : x) })} /></Field>
        <Button variant="ghost" className="w-11 p-0 text-destructive" title="Remover faixa" aria-label={`Remover faixa ${i + 1}`} onClick={() => onChange({ ...value, ranges: value.ranges.filter((x) => x.id !== r.id) })}><Trash2 className="h-4 w-4" /></Button>
      </div>)}
      <Button variant="ghost" disabled={value.ranges.length >= 50} onClick={() => { const from = Math.max(0, ...value.ranges.map((r) => r.to)); onChange({ ...value, ranges: [...value.ranges, { id: uid(), from, to: from + 3, price: 0 }] }); }}><Plus className="h-4 w-4" />Adicionar faixa</Button>
    </div>}
  </section>;
}