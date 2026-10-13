import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, LineChart, Package, ClipboardList, Settings as Cog, LogOut, Tags, Plus } from "lucide-react";
import { Button } from "@/components/Button";
import { Categories, Extras } from "@/components/admin/CatalogSettings";
import { Logo } from "@/components/Logo";
import { Field } from "@/components/Field";
import { Reports, Overview } from "@/components/admin/Reports";
import { Products } from "@/components/admin/Products";
import { Orders } from "@/components/admin/Orders";
import { StoreSettings } from "@/components/admin/StoreSettings";
import { storeStatus, useStore } from "@/lib/store";
import { useNow } from "@/hooks/use-now";

export const Route = createFileRoute("/vendedor")({
  head: () => ({
    meta: [
      { title: "Painel do vendedor — Brasa Burger" },
      { name: "description", content: "Painel de gestão da Brasa Burger: pedidos, faturamento, produtos e horários." },
      { property: "og:title", content: "Painel do vendedor — Brasa Burger" },
      { property: "og:description", content: "Gestão de pedidos, cardápio e horários." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Vendor,
});

// Login simples de demonstração (não é seguro para produção).
const DEMO = { email: "admin@brasaburger.com", password: "brasa123" };
const SKEY = "brasa-admin";

const TABS = [
  { id: "inicio", label: "Início", icon: LayoutDashboard },
  { id: "faturamento", label: "Faturamento", icon: LineChart },
  { id: "pedidos", label: "Pedidos", icon: ClipboardList },
  { id: "produtos", label: "Produtos", icon: Package },
  { id: "categorias", label: "Categorias", icon: Tags },
  { id: "adicionais", label: "Adicionais", icon: Plus },
  { id: "config", label: "Loja", icon: Cog },
] as const;

function Vendor() {
  const [auth, setAuth] = useState<boolean | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("inicio");
  const { settings } = useStore();
  const status = storeStatus(settings, useNow());
  useEffect(() => setAuth(sessionStorage.getItem(SKEY) === "1"), []);

  if (auth === null) return null;
  if (!auth) return <Login onOk={() => { sessionStorage.setItem(SKEY, "1"); setAuth(true); }} />;

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/"><Logo name={settings.name} logo={settings.logo} /></Link>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.open ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}>{status.open ? "Aberto" : "Fechado"}</span>
          <button className="btn-ghost" onClick={() => { sessionStorage.removeItem(SKEY); setAuth(false); }}><LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sair</span></button>
        </div>
         <nav className="mx-auto hidden max-w-6xl flex-wrap gap-2 px-4 pb-3 md:flex">
           {TABS.map((t) => <Button key={t.id} onClick={() => setTab(t.id)} variant={tab === t.id ? "primary" : "ghost"} aria-pressed={tab === t.id}><t.icon className="h-4 w-4" />{t.label}</Button>)}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === "inicio" && <Overview />}
        {tab === "faturamento" && <Reports />}
        {tab === "pedidos" && <Orders />}
        {tab === "produtos" && <Products />}
        {tab === "categorias" && <Categories />}
        {tab === "adicionais" && <Extras />}
        {tab === "config" && <StoreSettings />}
      </main>
       <nav className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t bg-card md:hidden">
        {TABS.map((t) => (
           <Button variant="ghost" key={t.id} onClick={() => setTab(t.id)} className={`min-h-14 min-w-20 flex-1 flex-col gap-0.5 rounded-none border-0 px-2 text-xs ${tab === t.id ? "text-primary" : "text-muted-foreground"}`} aria-pressed={tab === t.id}>
            <t.icon className="h-5 w-5" />{t.label}
           </Button>
        ))}
      </nav>
    </div>
  );
}

function Login({ onOk }: { onOk: () => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form
        className="w-full max-w-sm space-y-4 rounded-3xl bg-card p-8 shadow-warm"
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Informe um e-mail válido.");
          if (!pw) return setErr("Informe a senha.");
          if (email.trim().toLowerCase() !== DEMO.email || pw !== DEMO.password) return setErr("E-mail ou senha incorretos.");
          onOk();
        }}
      >
        <div className="flex justify-center"><Logo /></div>
        <h1 className="text-center text-2xl font-extrabold">Área do vendedor</h1>
        <Field label="E-mail"><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></Field>
        <Field label="Senha"><input className="field" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></Field>
        {err && <p role="alert" className="text-sm font-semibold text-destructive">{err}</p>}
        <button className="btn w-full">Entrar</button>
        <p className="text-center text-xs text-muted-foreground">Demo: {DEMO.email} / {DEMO.password}</p>
      </form>
    </div>
  );
}
