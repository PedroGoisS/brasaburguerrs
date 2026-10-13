import { z } from "zod";

export const deliverySchema = z.object({
  model: z.enum(["km", "neighborhood", "ranges"]),
  perKm: z.number().finite().min(0).max(10000),
  maxKm: z.number().finite().positive().max(500).nullable(),
  neighborhoods: z.array(z.object({ id: z.string(), name: z.string().trim().min(1).max(100), price: z.number().finite().min(0).max(10000) })).max(100),
  ranges: z.array(z.object({ id: z.string(), from: z.number().finite().min(0).max(500), to: z.number().finite().positive().max(500), price: z.number().finite().min(0).max(10000) })).max(50),
});
export type DeliverySettings = z.infer<typeof deliverySchema>;
export type DeliveryLocation = { distanceKm: number; neighborhood: string; address: string };
export type DeliveryPrice = { allowed: boolean; fee: number; message: string };
export const defaultDelivery: DeliverySettings = { model: "km", perKm: 0, maxKm: null, neighborhoods: [], ranges: [] };
export const normalizeNeighborhood = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLowerCase();

export function validateDelivery(value: DeliverySettings): string | null {
  const parsed = deliverySchema.safeParse(value);
  if (!parsed.success) return "Confira os valores da entrega: informe números válidos, maiores ou iguais a zero.";
  const names = value.neighborhoods.map((n) => normalizeNeighborhood(n.name));
  if (new Set(names).size !== names.length) return "Cadastre cada bairro apenas uma vez.";
  if (value.model === "neighborhood" && !names.length) return "Cadastre pelo menos um bairro atendido.";
  const ranges = [...value.ranges].sort((a, b) => a.from - b.from);
  if (ranges.some((r, i) => r.from >= r.to || (i > 0 && r.from < ranges[i - 1].to))) return "As faixas precisam ter início menor que o fim e não podem se sobrepor.";
  if (value.model === "ranges" && !ranges.length) return "Cadastre pelo menos uma faixa de distância.";
  return null;
}

export function calculateDelivery(config: DeliverySettings, distanceKm: number, neighborhood: string, pickup = false): DeliveryPrice {
  if (pickup) return { allowed: true, fee: 0, message: "Retirada no local" };
  const invalid = validateDelivery(config);
  if (invalid) return { allowed: false, fee: 0, message: invalid };
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return { allowed: false, fee: 0, message: "Não foi possível confirmar a distância de entrega." };
  if (config.maxKm !== null && distanceKm > config.maxKm) return { allowed: false, fee: 0, message: `Endereço fora da área de entrega. Atendemos até ${config.maxKm.toLocaleString("pt-BR")} km.` };
  let fee: number;
  if (config.model === "km") fee = config.perKm * distanceKm;
  else if (config.model === "neighborhood") {
    const found = config.neighborhoods.find((n) => normalizeNeighborhood(n.name) === normalizeNeighborhood(neighborhood));
    if (!found) return { allowed: false, fee: 0, message: neighborhood ? `Não entregamos no bairro ${neighborhood}.` : "Não foi possível identificar o bairro deste endereço. Informe o endereço completo." };
    fee = found.price;
  } else {
    const sorted = [...config.ranges].sort((a, b) => a.from - b.from);
    const found = sorted.find((r, i) => distanceKm >= r.from && (distanceKm < r.to || (i === sorted.length - 1 && distanceKm === r.to)));
    if (!found) return { allowed: false, fee: 0, message: "Endereço fora das faixas de entrega atendidas." };
    fee = found.price;
  }
  return { allowed: true, fee: Math.round((fee + Number.EPSILON) * 100) / 100, message: "Entrega disponível" };
}