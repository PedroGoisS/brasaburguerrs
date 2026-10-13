import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/Button";
import { brl, extrasFor, itemPrice, useStore, type Product, type SelectedExtra } from "@/lib/store";

export function ProductOptions({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (product: Product, extras: SelectedExtra[], qty: number) => void }) {
  const { extras } = useStore();
  const available = extrasFor(product, extras);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [qty, setQty] = useState(1);
  const chosen = available.flatMap((e) => selected[e.id] > 0 ? [{ id: e.id, name: e.name, price: e.price, qty: selected[e.id] }] : []);
  const total = itemPrice(product.price, chosen) * qty;
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/60" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg bg-background shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b p-4"><Dialog.Title className="break-words text-2xl font-extrabold">{product.name}</Dialog.Title><Button variant="ghost" className="w-11 shrink-0 p-0" aria-label="Fechar produto" onClick={onClose}><X className="h-5 w-5" /></Button></div>
      <div className="space-y-4 overflow-y-auto p-4">
        {product.images[0] && <img src={product.images[0]} alt={product.name} className="aspect-[2/1] w-full rounded-lg object-cover" />}
        <Dialog.Description className="text-sm text-muted-foreground">{product.description}</Dialog.Description>
        <p className="text-xl font-bold text-primary">{brl(product.price)}</p>
        {available.length > 0 && <fieldset><legend className="mb-3 text-lg font-bold">Adicionais</legend><div className="space-y-3">{available.map((e) => <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <label className="flex min-w-0 flex-1 items-center gap-3"><input type="checkbox" checked={(selected[e.id] ?? 0) > 0} onChange={(event) => setSelected((s) => ({ ...s, [e.id]: event.target.checked ? 1 : 0 }))} /><span className="break-words"><span className="block font-semibold">{e.name}</span><span className="text-sm text-muted-foreground">+ {brl(e.price)}</span></span></label>
          {(selected[e.id] ?? 0) > 0 && <div className="flex shrink-0 items-center gap-2"><Button variant="ghost" className="h-9 min-h-0 w-9 p-0" aria-label={`Diminuir ${e.name}`} disabled={selected[e.id] <= 1} onClick={() => setSelected((s) => ({ ...s, [e.id]: Math.max(1, s[e.id] - 1) }))}><Minus className="h-4 w-4" /></Button><span className="w-6 text-center">{selected[e.id]}</span><Button variant="ghost" className="h-9 min-h-0 w-9 p-0" aria-label={`Aumentar ${e.name}`} disabled={selected[e.id] >= 99} onClick={() => setSelected((s) => ({ ...s, [e.id]: Math.min(99, s[e.id] + 1) }))}><Plus className="h-4 w-4" /></Button></div>}
        </div>)}</div></fieldset>}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t p-4"><div className="flex items-center gap-2"><Button variant="ghost" className="w-11 p-0" aria-label="Diminuir quantidade do produto" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)}><Minus className="h-4 w-4" /></Button><span className="w-6 text-center font-bold">{qty}</span><Button variant="ghost" className="w-11 p-0" aria-label="Aumentar quantidade do produto" disabled={qty >= 99} onClick={() => setQty((q) => q + 1)}><Plus className="h-4 w-4" /></Button></div><Button className="flex-1" disabled={!product.available} onClick={() => { onAdd(product, chosen, qty); onClose(); }}>Adicionar · {brl(total)}</Button></div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}