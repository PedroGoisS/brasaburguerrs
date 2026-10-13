import { useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { brl, setState, uid, useStore, type Product } from "@/lib/store";

export function Products() {
  const { products, categories } = useStore();
  const [draft, setDraft] = useState<Product | null>(null);
  const save = () => {
    if (!draft || !draft.name.trim() || !categories.includes(draft.category)) return;
    const product = { ...draft, name: draft.name.trim(), description: draft.description.trim() };
    setState((s) => ({ ...s, products: s.products.some((p) => p.id === product.id) ? s.products.map((p) => p.id === product.id ? product : p) : [...s.products, product] }));
    setDraft(null);
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-extrabold">Produtos</h1>
      <Button disabled={!categories.length} onClick={() => setDraft({ id: uid(), name: "", description: "", price: 0, category: categories[0] ?? "", available: true, images: [] })}><Plus className="h-4 w-4" />Novo produto</Button>
    </div>
    {draft && <form className="space-y-4 border-b pb-5" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <h2 className="text-xl font-bold">Editar produto</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome"><input className="field" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <Field label="Preço (R$)"><input className="field" type="number" min="0.01" step="0.01" required value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} /></Field>
        <Field label="Categoria"><select aria-label="Categoria" className="field" required value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Foto (URL)"><input className="field" value={draft.images[0] ?? ""} onChange={(e) => setDraft({ ...draft, images: e.target.value ? [e.target.value, ...draft.images.slice(1)] : [] })} /></Field>
      </div>
      <Field label="Descrição"><textarea className="field" rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
      <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={draft.available} onChange={(e) => setDraft({ ...draft, available: e.target.checked })} />Disponível</label>
      <div className="flex gap-2"><Button type="submit"><Save className="h-4 w-4" />Salvar produto</Button><Button variant="ghost" onClick={() => setDraft(null)}><X className="h-4 w-4" />Cancelar</Button></div>
    </form>}
    {!products.length && <p className="text-muted-foreground">Nenhum produto cadastrado.</p>}
    <div className="grid gap-3 md:grid-cols-2">{products.map((p) => <article key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-card p-4">
      {p.images[0] && <img src={p.images[0]} alt={p.name} className="h-16 w-16 rounded-lg object-cover" />}
      <div className="min-w-0 flex-1"><h2 className="break-words font-bold">{p.name}</h2><p className="text-sm text-muted-foreground">{p.category} · {brl(p.price)}</p><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.available} onChange={(e) => setState((s) => ({ ...s, products: s.products.map((x) => x.id === p.id ? { ...x, available: e.target.checked } : x) }))} />Disponível</label></div>
      <Button variant="ghost" className="w-11 p-0" aria-label={`Editar ${p.name}`} title="Editar" onClick={() => setDraft({ ...p, images: [...p.images] })}><Pencil className="h-4 w-4" /></Button>
      <Button variant="ghost" className="w-11 p-0 text-destructive" aria-label={`Excluir ${p.name}`} title="Excluir" onClick={() => { if (window.confirm(`Excluir ${p.name}?`)) setState((s) => ({ ...s, products: s.products.filter((x) => x.id !== p.id) })); }}><Trash2 className="h-4 w-4" /></Button>
    </article>)}</div>
  </div>;
}