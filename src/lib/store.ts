import { useSyncExternalStore } from "react";
import type { DeliverySettings } from "./delivery";
import classico from "@/assets/p-classico.jpg";
import bacon from "@/assets/p-bacon.jpg";
import combo from "@/assets/p-combo.jpg";
import fritas from "@/assets/p-fritas.jpg";
import refri from "@/assets/p-refri.jpg";
import brownie from "@/assets/p-brownie.jpg";

export const CATEGORIES = ["Hambúrgueres", "Combos", "Acompanhamentos", "Bebidas", "Sobremesas"] as const;
export type Category = string;
export const PAYMENTS = ["Pix", "Cartão", "Dinheiro"] as const;
export type Payment = (typeof PAYMENTS)[number];
export const STATUSES = ["Novo", "Em preparo", "Saiu para entrega", "Entregue", "Cancelado"] as const;
export type OrderStatus = (typeof STATUSES)[number];
export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export type Shift = { open: string; close: string };
export type DayHours = { closed: boolean; shifts: Shift[] };
export type Special = { id: string; date: string; closed: boolean; shifts: Shift[]; note: string };
export type Product = {
  id: string; name: string; description: string; price: number;
  category: Category; available: boolean; images: string[];
};
export type Extra = { id: string; name: string; price: number; productIds: string[]; categories: string[] };
export type SelectedExtra = { id: string; name: string; price: number; qty: number };
export type OrderItem = { productId: string; name: string; price: number; qty: number; extras?: SelectedExtra[] };
export type Order = {
  id: string; createdAt: string; customer: string; phone: string; address: string;
  pickup: boolean; payment: Payment; items: OrderItem[]; notes: string;
  subtotal: number; fee: number; total: number; status: OrderStatus; scheduledFor?: string; distanceKm?: number; neighborhood?: string;
};
export type Settings = {
  name: string; logo: string; whatsapp: string; deliveryFee: number; deliveryTime: string;
  minOrder: number; areas: string; pickup: boolean; address: string; instagram: string;
  override: null | "closed" | "open"; hours: DayHours[]; specials: Special[]; delivery?: DeliverySettings;
};
export type State = { settings: Settings; products: Product[]; orders: Order[]; categories: string[]; extras: Extra[] };

export const extrasFor = (product: Product, extras: Extra[]) => extras.filter((e) => e.productIds.includes(product.id) || e.categories.includes(product.category));
export const itemPrice = (price: number, extras: SelectedExtra[]) => Math.round((price + extras.reduce((sum, e) => sum + e.price * e.qty, 0)) * 100) / 100;
export const variantKey = (productId: string, extras: SelectedExtra[]) => JSON.stringify([productId, extras.map((e) => [e.id, e.qty]).sort((a, b) => String(a[0]).localeCompare(String(b[0])))]);

export function normalizeState(saved: State): State {
  return { ...saved, categories: saved.categories ?? [...new Set([...CATEGORIES, ...saved.products.map((p) => p.category)])], extras: saved.extras ?? [] };
}

export function renameCategory(s: State, previous: string, next: string): State {
  return { ...s, categories: s.categories.map((c) => c === previous ? next : c), products: s.products.map((p) => p.category === previous ? { ...p, category: next } : p), extras: s.extras.map((e) => ({ ...e, categories: e.categories.map((c) => c === previous ? next : c) })) };
}

export function removeCategory(s: State, category: string, replacement: string): State {
  return { ...s, categories: s.categories.filter((c) => c !== category), products: s.products.map((p) => p.category === category ? { ...p, category: replacement } : p), extras: s.extras.map((e) => ({ ...e, categories: e.categories.filter((c) => c !== category) })) };
}

export const uid = () => Math.random().toString(36).slice(2, 10);

const seedProducts: Product[] = [
  { id: "p1", name: "Brasa Clássico", description: "Blend 160g na brasa, cheddar, alface, tomate e molho da casa no brioche.", price: 32.9, category: "Hambúrgueres", available: true, images: [classico] },
  { id: "p2", name: "Bacon Duplo BBQ", description: "Dois blends de 120g, muito bacon crocante, cheddar e barbecue defumado.", price: 42.9, category: "Hambúrgueres", available: true, images: [bacon] },
  { id: "p3", name: "Combo Brasa", description: "Brasa Clássico + fritas médias + refrigerante lata.", price: 46.9, category: "Combos", available: true, images: [combo] },
  { id: "p4", name: "Fritas da Casa", description: "Batatas rústicas sequinhas com sal e páprica defumada.", price: 16.9, category: "Acompanhamentos", available: true, images: [fritas] },
  { id: "p5", name: "Refrigerante", description: "Lata 350ml bem gelada. Cola, guaraná ou laranja.", price: 7.5, category: "Bebidas", available: true, images: [refri] },
  { id: "p6", name: "Brownie com Sorvete", description: "Brownie quentinho, bola de sorvete de creme e calda de chocolate.", price: 19.9, category: "Sobremesas", available: true, images: [brownie] },
];

const ev = (): DayHours => ({ closed: false, shifts: [{ open: "18:00", close: "23:00" }] });
const seedSettings: Settings = {
  name: "Brasa Burger", logo: "", whatsapp: "5511999999999", deliveryFee: 6, deliveryTime: "35–50 min",
  minOrder: 25, areas: "Centro, Vila Nova, Jardim América e Bela Vista", pickup: true,
  address: "Rua das Brasas, 123 – Centro, São Paulo/SP", instagram: "@brasaburger", override: null,
  hours: [
    { closed: false, shifts: [{ open: "11:00", close: "15:00" }, { open: "18:00", close: "23:00" }] },
    { closed: true, shifts: [] }, ev(), ev(), ev(),
    { closed: false, shifts: [{ open: "18:00", close: "23:59" }] },
    { closed: false, shifts: [{ open: "11:00", close: "15:00" }, { open: "18:00", close: "23:59" }] },
  ],
  specials: [{ id: "s1", date: `${new Date().getFullYear()}-12-25`, closed: true, shifts: [], note: "Natal – estaremos fechados" }],
};

function seedOrders(): Order[] {
  const out: Order[] = [];
  const names = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Felipe", "Gabi", "Hugo"];
  for (let d = 0; d < 75; d++) {
    const n = 1 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) {
      const date = new Date(Date.now() - d * 86400000);
      date.setHours(18 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60));
      const items = seedProducts.filter(() => Math.random() > 0.6).map((p) => ({ productId: p.id, name: p.name, price: p.price, qty: 1 + Math.floor(Math.random() * 2) }));
      if (!items.length) items.push({ productId: "p1", name: seedProducts[0].name, price: seedProducts[0].price, qty: 1 });
      const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);
      const pickup = Math.random() > 0.7;
      const fee = pickup ? 0 : 6;
      out.push({
        id: uid(), createdAt: date.toISOString(), customer: names[Math.floor(Math.random() * names.length)],
        phone: "(11) 98888-0000", address: pickup ? "" : "Rua Exemplo, 10", pickup,
        payment: PAYMENTS[Math.floor(Math.random() * 3)], items, notes: "", subtotal, fee, total: subtotal + fee,
        status: d === 0 ? (["Novo", "Em preparo"] as const)[i % 2] : "Entregue",
      });
    }
  }
  return out;
}

const KEY = "brasa-burger-v1";
const serverState: State = { settings: seedSettings, products: seedProducts, orders: [], categories: [...CATEGORIES], extras: [] };
let state: State = serverState;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = normalizeState(JSON.parse(raw));
    else { state = { ...serverState, orders: seedOrders() }; persist(); }
  } catch { state = { ...serverState, orders: seedOrders() }; }
  window.addEventListener("storage", (e) => {
    if (e.key === KEY && e.newValue) { try { state = normalizeState(JSON.parse(e.newValue)); listeners.forEach((l) => l()); } catch { /* Ignore malformed external storage. */ } }
  });
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
  catch { alert("Espaço de armazenamento cheio. Use fotos menores ou remova algumas."); return false; }
}

export function setState(fn: (s: State) => State) {
  load();
  const prev = state;
  state = fn(state);
  if (!persist()) state = prev;
  listeners.forEach((l) => l());
}

export function useStore(): State {
  return useSyncExternalStore(
    (l) => { load(); listeners.add(l); if (loaded) l(); return () => listeners.delete(l); },
    () => { load(); return state; },
    () => serverState,
  );
}

/* ---------- Horários (fuso de Brasília) ---------- */
export type BrNow = { date: string; weekday: number; minutes: number };
export function brNow(d = new Date()): BrNow {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short" })
      .formatToParts(d).map((x) => [x.type, x.value]),
  );
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { date: `${p.year}-${p.month}-${p.day}`, weekday: wd, minutes: (Number(p.hour) % 24) * 60 + Number(p.minute) };
}
export const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

function addDays(date: string, n: number) {
  const d = new Date(date + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n);
  return { date: d.toISOString().slice(0, 10), weekday: d.getUTCDay() };
}
export function scheduleFor(s: Settings, date: string, weekday: number): DayHours & { special?: Special } {
  const sp = s.specials.find((x) => x.date === date);
  if (sp) return { closed: sp.closed, shifts: sp.shifts, special: sp };
  return s.hours[weekday];
}

export type Status = { open: boolean; message: string; nextOpen?: string };
export function storeStatus(s: Settings, d = new Date()): Status {
  const now = brNow(d);
  const today = scheduleFor(s, now.date, now.weekday);
  const inShift = !today.closed && today.shifts.some((sh) => now.minutes >= toMin(sh.open) && now.minutes < toMin(sh.close));
  if (inShift) {
    const sh = today.shifts.find((x) => now.minutes >= toMin(x.open) && now.minutes < toMin(x.close));
    if (sh) return { open: true, message: `Aberto agora · até ${sh.close}` };
  }
  // próximo horário
  if (!today.closed) {
    const next = today.shifts.find((sh) => toMin(sh.open) > now.minutes);
    if (next) return { open: false, message: `Fechado · Abrimos hoje às ${next.open}`, nextOpen: `${now.date}T${next.open}` };
  }
  for (let i = 1; i <= 14; i++) {
    const { date, weekday } = addDays(now.date, i);
    const day = scheduleFor(s, date, weekday);
    if (!day.closed && day.shifts.length) {
      const label = i === 1 ? "amanhã" : `${WEEKDAYS[weekday].toLowerCase()} (${date.slice(8, 10)}/${date.slice(5, 7)})`;
      return { open: false, message: `Fechado · Abrimos ${label} às ${day.shifts[0].open}`, nextOpen: `${date}T${day.shifts[0].open}` };
    }
  }
  return { open: false, message: "Fechado" };
}

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
