import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/Button";
import { ProductOptions } from "@/components/ProductOptions";
import { calculateDelivery, type DeliveryLocation } from "@/lib/delivery";
import { getDeliveryDistance, startDeliverySession } from "@/lib/delivery.functions";
import { ShoppingBag, Search, Plus, Minus, Trash2, X, Clock, Bike, Wallet, MapPin, Store, Instagram, Phone, CalendarClock } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Logo } from "@/components/Logo";
import { useNow } from "@/hooks/use-now";
import { PAYMENTS, WEEKDAYS, brNow, brl, itemPrice, variantKey, setState, storeStatus, uid, useStore, type Payment, type Product, type SelectedExtra } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Brasa Burger — Hambúrguer na brasa com entrega" },
      { name: "description", content: "Peça hambúrgueres artesanais na brasa, combos, fritas e sobremesas. Entrega rápida ou retirada no local." },
      { property: "og:title", content: "Brasa Burger — Hambúrguer na brasa" },
      { property: "og:description", content: "Cardápio, horários e pedido pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

type CartLine = { id: string; key: string; qty: number; extras: SelectedExtra[] };

function Home() {
  const { settings, products, categories } = useStore();
  const now = useNow();
  const status = storeStatus(settings, now);
  const [cat, setCat] = useState<string>("Todos");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const activeCategory = categories.includes(cat) ? cat : "Todos";
  const list = products.filter((p) => (activeCategory === "Todos" || p.category === activeCategory) && (p.name + p.description).toLowerCase().includes(q.toLowerCase()));
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const add = (p: Product, extras: SelectedExtra[], qty: number) => {
    const key = variantKey(p.id, extras);
    setCart((c) => c.some((l) => l.key === key) ? c.map((l) => l.key === key ? { ...l, qty: l.qty + qty } : l) : [...c, { id: p.id, key, qty, extras }]);
  };

  const today = brNow(now);

  return (
    <div className="min-h-screen">
      <div role="status" aria-live="polite" className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-card py-1.5 text-sm font-bold">
        <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${status.open ? "bg-success" : "bg-destructive"}`} />{status.open ? "Loja Aberta" : "Loja Fechada"}
      </div>
      <header className="sticky top-8 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <a href="#topo"><Logo name={settings.name} logo={settings.logo} /></a>
          <nav className="hidden gap-6 font-semibold md:flex">
            <a href="#cardapio" className="hover:text-primary">Cardápio</a>
            <a href="#horarios" className="hover:text-primary">Horários</a>
            <a href="#sobre" className="hover:text-primary">Sobre</a>
            <a href="#contato" className="hover:text-primary">Contato</a>
          </nav>
          <button onClick={() => setOpen(true)} className="btn relative" aria-label={`Abrir carrinho, ${count} itens`}>
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden sm:inline">Carrinho</span>
            {count > 0 && <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-ink text-xs text-ink-foreground">{count}</span>}
          </button>
        </div>
        <nav className="flex justify-around border-t py-2 text-sm font-semibold md:hidden">
          <a href="#cardapio">Cardápio</a><a href="#horarios">Horários</a><a href="#sobre">Sobre</a><a href="#contato">Contato</a>
        </nav>
      </header>

      <section id="topo" className="mx-auto max-w-6xl px-4 pt-6">
        <div className="relative overflow-hidden rounded-3xl">
          <img src={hero} alt="Hambúrguer duplo com cheddar derretido em frente às chamas" width={1600} height={912} className="h-[420px] w-full object-cover md:h-[520px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
          <div className="absolute bottom-0 p-6 md:p-12">
            <p className="mb-2 font-bold uppercase tracking-widest text-primary">Feito na brasa</p>
            <h1 className="max-w-xl text-5xl font-extrabold leading-[0.95] text-ink-foreground md:text-7xl">O fogo deixa tudo mais gostoso.</h1>
            <a href="#cardapio" className="btn mt-6 px-8 text-lg shadow-warm">Pedir agora</a>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Info icon={<Clock />} t="Entrega" v={settings.deliveryTime} />
          <Info icon={<Bike />} t="Taxa" v={settings.delivery?.model === "km" ? `${brl(settings.delivery.perKm)}/km` : "Conforme endereço"} />
          <Info icon={<Wallet />} t="Pedido mínimo" v={brl(settings.minOrder)} />
          <Info icon={<Store />} t="Retirada" v={settings.pickup ? "Sim, no local" : "Não"} />
        </div>
      </section>

      <section id="cardapio" className="mx-auto max-w-6xl scroll-mt-32 px-4 py-14">
        <h2 className="text-4xl font-extrabold text-primary md:text-5xl">Cardápio</h2>
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative md:w-72">
            <span className="sr-only">Buscar no cardápio</span>
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="field pl-10" />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["Todos", ...categories].map((c) => (
              <Button key={c} variant={activeCategory === c ? "primary" : "ghost"} onClick={() => setCat(c)} className="whitespace-nowrap" aria-pressed={activeCategory === c}>{c}</Button>
            ))}
          </div>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <article key={p.id} className="flex flex-col overflow-hidden rounded-3xl bg-card shadow-sm">
              <div className="relative aspect-[4/3] bg-muted">
                {p.images[0] && <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover" />}
                {!p.available && <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-sm font-bold text-ink-foreground">Esgotado</span>}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{p.category}</p>
                <h3 className="text-xl font-extrabold"><Button variant="ghost" className="justify-start border-0 bg-transparent p-0 text-left" disabled={!p.available} onClick={() => setSelectedProduct(p)}>{p.name}</Button></h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-display text-2xl font-extrabold text-primary">{brl(p.price)}</span>
                   <Button disabled={!p.available} onClick={() => setSelectedProduct(p)}><Plus className="h-4 w-4" /> Adicionar</Button>
                </div>
              </div>
            </article>
          ))}
          {list.length === 0 && <p className="text-muted-foreground">Nenhum produto encontrado.</p>}
        </div>
      </section>

      <section id="horarios" className="scroll-mt-32 bg-card py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2">
          <div>
            <h2 className="text-4xl font-extrabold text-primary">Horário de funcionamento</h2>
            <p className="mt-2 text-muted-foreground">Horário de Brasília.</p>
            <table className="mt-5 w-full text-left">
              <tbody>
                {[1, 2, 3, 4, 5, 6, 0].map((wd) => {
                  const h = settings.hours[wd];
                  const isToday = wd === today.weekday;
                  return (
                    <tr key={wd} className={isToday ? "bg-primary font-bold text-primary-foreground" : "border-b"}>
                      <th className="rounded-l-xl px-3 py-3 font-semibold">{WEEKDAYS[wd]}{isToday && " (hoje)"}</th>
                      <td className="rounded-r-xl px-3 py-3 text-right">{h.closed || !h.shifts.length ? "Fechado" : h.shifts.map((s) => `${s.open} – ${s.close}`).join(" · ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div id="sobre" className="scroll-mt-32 space-y-4">
            <h2 className="text-4xl font-extrabold text-primary">Sobre a gente</h2>
            <p>Hambúrguer artesanal grelhado na brasa de verdade, pão brioche da casa e ingredientes frescos todos os dias.</p>
            <ul className="space-y-3">
              <li className="flex gap-3"><MapPin className="text-primary" /> <span><b>Áreas atendidas:</b> {settings.areas}</span></li>
              <li className="flex gap-3"><Wallet className="text-primary" /> <span><b>Pagamento:</b> Pix, cartão e dinheiro</span></li>
              <li className="flex gap-3"><Store className="text-primary" /> <span><b>Retirada no local:</b> {settings.pickup ? "disponível" : "indisponível"}</span></li>
            </ul>
          </div>
        </div>
      </section>

      <footer id="contato" className="scroll-mt-32 bg-ink py-12 text-ink-foreground">
         <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2">
          <div><Logo name={settings.name} logo={settings.logo} /><p className="mt-3 text-sm opacity-80">{settings.address}</p></div>
          <div className="space-y-2 text-sm">
            <h3 className="mb-2 text-lg font-bold">Contato</h3>
            <a className="flex gap-2" href={`https://wa.me/${settings.whatsapp}`}><Phone className="h-4 w-4" /> WhatsApp</a>
            <a className="flex gap-2" href={`https://instagram.com/${settings.instagram.replace("@", "")}`}><Instagram className="h-4 w-4" /> {settings.instagram}</a>
          </div>
        </div>
      </footer>

      {open && <Cart cart={cart} setCart={setCart} onClose={() => setOpen(false)} status={status} />}
      {selectedProduct && <ProductOptions key={selectedProduct.id} product={products.find((p) => p.id === selectedProduct.id) ?? selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={add} />}
    </div>
  );
}

function Info({ icon, t, v }: { icon: React.ReactNode; t: string; v: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-4">
      <span className="text-primary">{icon}</span>
      <div><p className="text-xs font-semibold uppercase text-muted-foreground">{t}</p><p className="font-bold">{v}</p></div>
    </div>
  );
}

function Cart({ cart, setCart, onClose, status }: { cart: CartLine[]; setCart: React.Dispatch<React.SetStateAction<CartLine[]>>; onClose: () => void; status: ReturnType<typeof storeStatus> }) {
  const { products, settings } = useStore();
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [f, setF] = useState({ name: "", phone: "", address: "", pickup: false, payment: "Pix" as Payment, schedule: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const startSession = useServerFn(startDeliverySession);
  const lookupDistance = useServerFn(getDeliveryDistance);
  const [quote, setQuote] = useState<{ key: string; location: DeliveryLocation } | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");
  const requestId = useRef(0);
  const cached = useRef(new Map<string, { location: DeliveryLocation; expires: number }>());
  const quoteKey = JSON.stringify([settings.address, f.address.trim()]);
  const location = quote?.key === quoteKey ? quote.location : null;
  const pricing = settings.delivery && location ? calculateDelivery(settings.delivery, location.distanceKm, location.neighborhood) : null;
  const deliveryReady = f.pickup || Boolean(pricing?.allowed);
  const calculate = async () => {
    if (calculating) return;
    if (!settings.delivery) { setDeliveryError("A loja ainda não configurou a entrega. Entre em contato ou escolha retirada."); return; }
    if (f.address.trim().length < 10) { setDeliveryError("Informe rua, número, bairro e cidade."); return; }
    const current = ++requestId.current;
    setCalculating(true); setDeliveryError(""); setQuote(null);
    try {
      const saved = cached.current.get(quoteKey);
      let result: DeliveryLocation;
      if (saved && saved.expires > Date.now()) result = saved.location;
      else {
        await startSession();
        result = await lookupDistance({ data: { origin: settings.address, destination: f.address.trim() } });
        if (cached.current.size >= 10) cached.current.clear();
        cached.current.set(quoteKey, { location: result, expires: Date.now() + 300000 });
      }
      if (current === requestId.current) setQuote({ key: quoteKey, location: result });
    } catch (error) { if (current === requestId.current) setDeliveryError(error instanceof Error ? error.message : "Não foi possível calcular a entrega. Tente novamente."); }
    finally { if (current === requestId.current) setCalculating(false); }
  };
  const changeAddress = (address: string) => { requestId.current++; setCalculating(false); setQuote(null); setDeliveryError(""); setF({ ...f, address }); };

  const lines = useMemo(() => cart.flatMap((l) => { const p = products.find((p) => p.id === l.id); return p ? [{ ...l, p }] : []; }), [cart, products]);
   const subtotal = Math.round(lines.reduce((s, l) => s + itemPrice(l.p.price, l.extras) * l.qty, 0) * 100) / 100;
  const fee = f.pickup ? 0 : pricing?.allowed ? pricing.fee : 0;
  const total = subtotal + (lines.length ? fee : 0);
   const qty = (key: string, d: number) => setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: Math.max(1, l.qty + d) } : l)));
  const canOrder = status.open || f.schedule;

  const submit = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = "Informe seu nome.";
    if (f.phone.replace(/\D/g, "").length < 10) e.phone = "Informe um telefone válido com DDD.";
    if (!f.pickup && f.address.trim().length < 5) e.address = "Informe o endereço de entrega.";
    if (!deliveryReady) e.address = pricing?.message ?? "Calcule e confirme a taxa de entrega antes de finalizar.";
    if (!lines.length || lines.some((l) => !l.p.available)) e.min = "Confira o carrinho: há produtos indisponíveis.";
    if (subtotal < settings.minOrder) e.min = `Pedido mínimo de ${brl(settings.minOrder)}.`;
    setErrors(e);
    if (Object.keys(e).length) return;
     const items = lines.map((l) => ({ productId: l.id, name: l.p.name, price: itemPrice(l.p.price, l.extras), qty: l.qty, extras: l.extras }));
    setState((s) => ({ ...s, orders: [{ id: uid(), createdAt: new Date().toISOString(), customer: f.name, phone: f.phone, address: f.pickup ? "" : location?.address ?? f.address, pickup: f.pickup, payment: f.payment, items, notes, subtotal, fee, total, status: "Novo", distanceKm: f.pickup ? undefined : location?.distanceKm, neighborhood: f.pickup ? undefined : location?.neighborhood, scheduledFor: !status.open ? status.nextOpen : undefined }, ...s.orders] }));
    const msg = [
      `*Novo pedido – ${settings.name}*`,
       ...items.map((i) => `${i.qty}x ${i.name} – ${brl(i.price * i.qty)}${i.extras.length ? `\n  Adicionais por unidade: ${i.extras.map((e) => `${e.qty}x ${e.name} (+ ${brl(e.price * e.qty)})`).join(", ")}` : ""}`),
      notes && `Obs.: ${notes}`,
      `Subtotal: ${brl(subtotal)}`, `Entrega: ${brl(fee)}`, `*Total: ${brl(total)}*`, "",
      `Nome: ${f.name}`, `Telefone: ${f.phone}`, f.pickup ? "Retirada no local" : `Endereço: ${location?.address ?? f.address}`,
      !f.pickup && location ? `Distância: ${location.distanceKm.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km` : "",
      `Pagamento: ${f.payment}`, !status.open && status.nextOpen ? `Agendado para: ${status.nextOpen.replace("T", " às ")}` : "",
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
    setCart([]); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/60" onClick={onClose}>
      <aside role="dialog" aria-label="Carrinho" className="flex h-full w-full max-w-md flex-col bg-background" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-2xl font-extrabold">{step === "cart" ? "Seu pedido" : "Finalizar"}</h2>
          <button onClick={onClose} aria-label="Fechar carrinho" className="btn-ghost h-11 w-11 p-0"><X /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {lines.length === 0 && <p className="text-muted-foreground">Seu carrinho está vazio.</p>}
          {step === "cart" && lines.length > 0 && (
            <>
              {lines.map((l) => (
                 <div key={l.key} className="flex gap-3 rounded-lg bg-card p-3">
                  <img src={l.p.images[0]} alt={l.p.name} className="h-16 w-16 rounded-xl object-cover" />
                   <div className="min-w-0 flex-1">
                    <p className="font-bold">{l.p.name}</p>
                     {l.extras.map((e) => <p key={e.id} className="break-words text-xs text-muted-foreground">+ {e.qty}x {e.name} por unidade · {brl(e.price * e.qty)}</p>)}
                     <p className="text-sm text-primary">{brl(itemPrice(l.p.price, l.extras) * l.qty)}</p>
                    <div className="mt-1 flex items-center gap-2">
                       <Button variant="ghost" aria-label="Diminuir" onClick={() => qty(l.key, -1)} className="h-9 min-h-0 w-9 p-0"><Minus className="h-4 w-4" /></Button>
                      <span className="w-6 text-center font-bold">{l.qty}</span>
                       <Button variant="ghost" aria-label="Aumentar" onClick={() => qty(l.key, 1)} className="h-9 min-h-0 w-9 p-0"><Plus className="h-4 w-4" /></Button>
                    </div>
                  </div>
                   <Button variant="ghost" aria-label="Remover item" onClick={() => setCart((c) => c.filter((x) => x.key !== l.key))} className="w-11 shrink-0 self-start p-0 text-destructive"><Trash2 className="h-5 w-5" /></Button>
                </div>
              ))}
              <label className="block"><span className="font-semibold">Observações</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: sem cebola" className="field mt-1" rows={2} />
              </label>
            </>
          )}
          {step === "checkout" && lines.length > 0 && (
            <div className="space-y-3">
              <Field label="Nome" error={errors.name}><input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
              <Field label="Telefone" error={errors.phone}><input className="field" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
              {settings.pickup && (
                <div className="grid grid-cols-2 gap-2">
                   <Button onClick={() => setF({ ...f, pickup: false })} variant={f.pickup ? "ghost" : "primary"}>Cadastrar endereço</Button>
                   <Button onClick={() => setF({ ...f, pickup: true })} variant={f.pickup ? "primary" : "ghost"}>Retirada no local</Button>
                </div>
              )}
               {!f.pickup && <div className="space-y-3">
                 <Field label="Endereço completo" error={errors.address}><input className="field" maxLength={250} autoComplete="street-address" placeholder="Rua, número, bairro e cidade" value={f.address} onChange={(e) => changeAddress(e.target.value)} /></Field>
                 <Button variant="ghost" className="w-full" disabled={calculating || f.address.trim().length < 10} onClick={() => void calculate()}><MapPin className="h-4 w-4" />{calculating ? "Calculando…" : "Calcular entrega"}</Button>
                 {deliveryError && <p role="alert" className="text-sm font-semibold text-destructive break-words">{deliveryError}</p>}
                 {location && <div role="status" className="space-y-1 border-l-2 border-primary pl-3 text-sm">
                   <p>{location.address}</p><p>{location.distanceKm.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km{location.neighborhood ? ` · ${location.neighborhood}` : ""}</p>
                   <p className={pricing?.allowed ? "font-semibold text-success" : "font-semibold text-destructive"}>{pricing?.message}</p>
                 </div>}
               </div>}
              <div><p className="mb-1 font-semibold">Pagamento</p>
                <div className="grid grid-cols-3 gap-2">{PAYMENTS.map((p) => <button key={p} onClick={() => setF({ ...f, payment: p })} className={f.payment === p ? "btn px-2" : "btn-ghost px-2"}>{p}</button>)}</div>
              </div>
            </div>
          )}
        </div>
        {lines.length > 0 && (
          <div className="space-y-2 border-t p-4">
             <Row k="Subtotal" v={brl(subtotal)} /><Row k={f.pickup ? "Retirada" : "Entrega"} v={deliveryReady ? brl(fee) : "A calcular"} />
             <div className="flex justify-between text-xl font-extrabold"><span>{deliveryReady ? "Total" : "Total parcial"}</span><span className="text-primary">{brl(total)}</span></div>
            {errors.min && <p className="text-sm font-semibold text-destructive">{errors.min}</p>}
            {!status.open && (
              <div className="rounded-xl bg-destructive/10 p-3 text-sm">
                <p className="font-bold text-destructive">Estamos fechados agora. {status.message.replace("Fechado · ", "")}.</p>
                {status.nextOpen && (
                  <label className="mt-2 flex items-center gap-2 font-semibold"><input type="checkbox" checked={f.schedule} onChange={(e) => setF({ ...f, schedule: e.target.checked })} className="h-5 w-5 accent-primary" /><CalendarClock className="h-4 w-4" /> Agendar para a próxima abertura</label>
                )}
              </div>
            )}
            {step === "cart" ? (
              <button className="btn w-full" disabled={!canOrder} onClick={() => setStep("checkout")}>Continuar</button>
            ) : (
               <div className="flex gap-2"><Button variant="ghost" onClick={() => setStep("cart")}>Voltar</Button><Button className="flex-1" disabled={!canOrder || !deliveryReady || calculating} onClick={submit}>Enviar pelo WhatsApp</Button></div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between text-sm"><span>{k}</span><span>{v}</span></div>;
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block"><span className="mb-1 block font-semibold">{label}</span>{children}
      {error && <span role="alert" className="mt-1 block text-sm font-semibold text-destructive">{error}</span>}
    </label>
  );
}
