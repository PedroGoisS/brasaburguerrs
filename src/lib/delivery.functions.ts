import { createServerFn } from "@tanstack/react-start";
import { getSession, useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import type { DeliveryLocation } from "./delivery";

type CheckoutData = { active?: boolean; quote?: { key: string; expires: number; location: DeliveryLocation } };
const input = z.object({ origin: z.string().trim().min(10).max(250), destination: z.string().trim().min(10).max(250) });

// Cookie contents are encrypted and signed; the session header is disabled so
// callers cannot substitute a browser-controlled session. CSRF remains enabled.
export const startDeliverySession = createServerFn({ method: "POST" }).handler(async () => {
  const password = process.env["CHECKOUT_SESSION_SECRET"];
  if (!password) throw new Error("Sessão de entrega indisponível. Tente novamente mais tarde.");
  const session = await useSession<CheckoutData>({ password, name: "brasa-checkout", maxAge: 1800, sessionHeader: false, cookie: { httpOnly: true, sameSite: "lax", secure: process.env["NODE_ENV"] === "production", path: "/" } });
  await session.update({ active: true });
  return { ready: true };
});

export const getDeliveryDistance = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }): Promise<DeliveryLocation> => {
    const password = process.env["CHECKOUT_SESSION_SECRET"];
    const apiKey = process.env["GOOGLE_MAPS_API_KEY"];
    const lovableKey = process.env["LOVABLE_API_KEY"];
    if (!password || !apiKey || !lovableKey) throw new Error("O cálculo de entrega ainda não está configurado.");
    const config = { password, name: "brasa-checkout", maxAge: 1800, sessionHeader: false as const, cookie: { httpOnly: true, sameSite: "lax" as const, secure: process.env["NODE_ENV"] === "production", path: "/" } };
    const session = await getSession<CheckoutData>(config);
    if (!session.data.active) throw new Error("Reabra o carrinho para iniciar uma sessão de entrega.");
    const key = JSON.stringify([data.origin.toLowerCase(), data.destination.toLowerCase()]);
    if (session.data.quote?.key === key && session.data.quote.expires > Date.now()) return session.data.quote.location;
    const headers = { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": apiKey, "Content-Type": "application/json" };
    const gateway = "https://connector-gateway.lovable.dev/google_maps";
    async function check(response: Response) {
      if (response.ok) return;
      const body = await response.text();
      console.error(`Google Maps failed [${response.status}]: ${body}`);
      if (response.status === 403) {
        let reason = "";
        try { const error = JSON.parse(body); reason = error.error?.details?.find((d: { reason?: string }) => d.reason)?.reason ?? ""; } catch { /* preserve status below */ }
        if (reason === "API_KEY_HTTP_REFERRER_BLOCKED") throw new Error("Google Maps [403]: a chave de servidor está restrita por site. O responsável deve alterar essa chave para restrição por IP ou nenhuma no Google Cloud Console.");
        if (reason === "API_KEY_SERVICE_BLOCKED") throw new Error("Google Maps [403]: habilite Routes API e Geocoding API nas permissões da chave de servidor no Google Cloud Console.");
        throw new Error(`Google Maps [403]: acesso negado. Confira as permissões da chave de servidor. ${body}`);
      }
      throw new Error(`Google Maps [${response.status}]: ${body}`);
    }
    const geocode = await fetch(`${gateway}/maps/api/geocode/json?address=${encodeURIComponent(data.destination)}&region=br&language=pt-BR`, { headers, signal: AbortSignal.timeout(15000) });
    await check(geocode);
    const geo = await geocode.json() as { status: string; error_message?: string; results?: Array<{ place_id: string; formatted_address: string; partial_match?: boolean; types: string[]; address_components: Array<{ long_name: string; types: string[] }> }> };
    if (geo.status !== "OK") throw new Error(geo.status === "ZERO_RESULTS" ? "Endereço não encontrado. Informe rua, número, bairro e cidade." : `Google Maps: ${geo.status} ${geo.error_message ?? ""}`);
    const place = geo.results?.[0];
    if (!place || place.partial_match || !place.types.some((t) => ["street_address", "premise", "subpremise"].includes(t))) throw new Error("Informe um endereço preciso com rua, número, bairro e cidade.");
    const route = await fetch(`${gateway}/routes/directions/v2:computeRoutes`, {
      method: "POST", headers: { ...headers, "X-Goog-FieldMask": "routes.distanceMeters,routes.duration" },
      body: JSON.stringify({ origin: { address: data.origin }, destination: { placeId: place.place_id }, travelMode: "DRIVE", routingPreference: "TRAFFIC_UNAWARE", computeAlternativeRoutes: false }),
      signal: AbortSignal.timeout(15000),
    });
    await check(route);
    const result = await route.json() as { routes?: Array<{ distanceMeters?: number; duration?: string }> };
    const first = result.routes?.[0];
    if (!first?.duration || !/^\d+(\.\d+)?s$/.test(first.duration)) throw new Error("Não foi encontrada uma rota de entrega para este endereço.");
    const meters = first.distanceMeters ?? 0;
    if (!Number.isFinite(meters) || meters < 0) throw new Error("Google Maps retornou uma distância inválida.");
    const components = place.address_components;
    const neighborhood = components.find((c) => c.types.includes("sublocality_level_1"))?.long_name ?? components.find((c) => c.types.includes("neighborhood"))?.long_name ?? components.find((c) => c.types.includes("sublocality"))?.long_name ?? "";
    const location = { distanceKm: meters / 1000, neighborhood, address: place.formatted_address };
    const manager = await useSession<CheckoutData>(config);
    await manager.update({ quote: { key, expires: Date.now() + 300000, location } });
    return location;
  });