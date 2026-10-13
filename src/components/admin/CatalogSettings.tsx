import { useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { brl, removeCategory, renameCategory, setState, uid, useStore, type Extra } from "@/lib/store";

export function Categories() {
  const { categories, products } = useStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [replacement, setReplacement] = useState("");
  return <div className="space-y-5">
    <h1 className="text-3xl font-extrabold">Categorias</h1>
    <form className="flex flex-wrap items-end gap-3 border-b pb-5" onSubmit={(event) => {
      event.preventDefault(); const next = name.trim();
      if (!next) { setError("Informe o nome da categoria."); return; }
      if (categories.some((c) => c !== editing && c.toLocaleLowerCase("pt-BR") === next.toLocaleLowerCase("pt-BR"))) { setError("Esta categoria já existe."); return; }
      setState((s) => editing === null ? { ...s, categories: [...s.categories, next] } : renameCategory(s, editing, next));
      setName(""); setEditing(null); setError("");
    }}>
      <Field label="Nome da categoria" error={error}><input className="field" maxLength={60} required value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Button type="submit">{editing === null ? <Plus className="h-4 w-4" /> : <Save className="h-4 w-4" />}{editing === null ? "Adicionar categoria" : "Salvar categoria"}</Button>
      {editing !== null && <Button variant="ghost" onClick={() => { setEditing(null); setName(""); setError(""); }}><X className="h-4 w-4" />Cancelar</Button>}
    </form>
    {deleting !== null && <div className="space-y-3 border-b pb-4">
      <p className="font-bold">Excluir {deleting}?</p>
      {products.some((p) => p.category === deleting) && <Field label="Mover produtos para"><select className="field" value={replacement} onChange={(e) => setReplacement(e.target.value)}><option value="">Selecione uma categoria</option>{categories.filter((c) => c !== deleting).map((c) => <option key={c}>{c}</option>)}</select></Field>}
      <div className="flex gap-2"><Button disabled={products.some((p) => p.category === deleting) && !replacement} onClick={() => { setState((s) => removeCategory(s, deleting, replacement)); setDeleting(null); if (editing === deleting) { setEditing(null); setName(""); } }}>Confirmar exclusão</Button><Button variant="ghost" onClick={() => setDeleting(null)}>Cancelar</Button></div>
    </div>}
    <div className="grid gap-3 sm:grid-cols-2">{categories.map((c) => <article key={c} className="flex items-center gap-3 rounded-lg bg-card p-4">
      <div className="min-w-0 flex-1"><h2 className="break-words font-bold">{c}</h2><p className="text-sm text-muted-foreground">{products.filter((p) => p.category === c).length} produtos</p></div>
      <Button variant="ghost" className="w-11 shrink-0 p-0" title="Editar categoria" aria-label={`Editar categoria ${c}`} onClick={() => { setEditing(c); setName(c); setError(""); }}><Pencil className="h-4 w-4" /></Button>
      <Button variant="ghost" className="w-11 shrink-0 p-0 text-destructive" title="Excluir categoria" aria-label={`Excluir categoria ${c}`} onClick={() => { setDeleting(c); setReplacement(""); }}><Trash2 className="h-4 w-4" /></Button>
    </article>)}</div>
    {!categories.length && <p className="text-muted-foreground">Nenhuma categoria cadastrada.</p>}
  </div>;
}

export function Extras() {
  const { extras, categories, products } = useStore();
  const [draft, setDraft] = useState<Extra | null>(null);
  const [error, setError] = useState("");
  const toggle = (key: "categories" | "productIds", value: string) => {
    if (!draft) return;
    setDraft({ ...draft, [key]: draft[key].includes(value) ? draft[key].filter((v) => v !== value) : [...draft[key], value] });
  };
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-extrabold">Adicionais</h1><Button onClick={() => { setDraft({ id: uid(), name: "", price: 0, productIds: [], categories: [] }); setError(""); }}><Plus className="h-4 w-4" />Novo adicional</Button></div>
    {draft && <form className="space-y-4 border-b pb-5" onSubmit={(e) => {
      e.preventDefault();
      if (!draft.name.trim() || !Number.isFinite(draft.price) || draft.price < 0) { setError("Confira o nome e o preço."); return; }
      if (!draft.productIds.length && !draft.categories.length) { setError("Selecione pelo menos um produto ou categoria."); return; }
      if (extras.some((x) => x.id !== draft.id && x.name.toLocaleLowerCase("pt-BR") === draft.name.trim().toLocaleLowerCase("pt-BR"))) { setError("Já existe um adicional com este nome."); return; }
      const saved = { ...draft, name: draft.name.trim() };
      setState((s) => ({ ...s, extras: s.extras.some((x) => x.id === saved.id) ? s.extras.map((x) => x.id === saved.id ? saved : x) : [...s.extras, saved] })); setDraft(null);
    }}>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Nome do adicional"><input className="field" required maxLength={80} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field><Field label="Preço do adicional (R$)"><input className="field" required type="number" min="0" step="0.01" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} /></Field></div>
      <fieldset><legend className="mb-2 font-bold">Disponível nas categorias</legend><div className="grid gap-2 sm:grid-cols-2">{categories.map((c) => <label key={c} className="flex items-center gap-2"><input type="checkbox" checked={draft.categories.includes(c)} onChange={() => toggle("categories", c)} />{c}</label>)}</div></fieldset>
      <fieldset><legend className="mb-2 font-bold">Disponível nos produtos</legend><div className="grid gap-2 sm:grid-cols-2">{products.map((p) => <label key={p.id} className="flex items-center gap-2"><input type="checkbox" checked={draft.productIds.includes(p.id)} onChange={() => toggle("productIds", p.id)} />{p.name}</label>)}</div></fieldset>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <div className="flex gap-2"><Button type="submit"><Save className="h-4 w-4" />Salvar adicional</Button><Button variant="ghost" onClick={() => setDraft(null)}><X className="h-4 w-4" />Cancelar</Button></div>
    </form>}
    {!extras.length && <p className="text-muted-foreground">Nenhum adicional cadastrado.</p>}
    <div className="grid gap-3 sm:grid-cols-2">{extras.map((x) => <article key={x.id} className="flex items-center gap-3 rounded-lg bg-card p-4"><div className="min-w-0 flex-1"><h2 className="break-words font-bold">{x.name} · {brl(x.price)}</h2><p className="break-words text-sm text-muted-foreground">{[...x.categories, ...products.filter((p) => x.productIds.includes(p.id)).map((p) => p.name)].join(", ") || "Sem produtos vinculados"}</p></div><Button variant="ghost" className="w-11 shrink-0 p-0" title="Editar adicional" aria-label={`Editar adicional ${x.name}`} onClick={() => { setDraft(structuredClone(x)); setError(""); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" className="w-11 shrink-0 p-0 text-destructive" title="Excluir adicional" aria-label={`Excluir adicional ${x.name}`} onClick={() => { if (window.confirm(`Excluir ${x.name}?`)) setState((s) => ({ ...s, extras: s.extras.filter((e) => e.id !== x.id) })); }}><Trash2 className="h-4 w-4" /></Button></article>)}</div>
  </div>;
}