const AUTO_TONE: Record<string, "rose" | "green" | "sand"> = {
  confirmado: "green",
  listo_para_entrega: "green",
  entregado: "green",
  pagado: "green",
  en_preparacion: "rose",
  parcial: "rose",
  pendiente: "sand",
  cancelado: "sand",
  Disponible: "green",
  "No disponible": "sand",
  Destacado: "rose"
};

export function StatusPill({ label, tone }: { label: string; tone?: "rose" | "green" | "sand" }) {
  const resolvedTone = tone ?? AUTO_TONE[label] ?? "sand";
  const tones = {
    rose: "bg-[#f4b6c4] text-[#3b2924]",
    green: "bg-[#b8d8c0] text-[#24432d]",
    sand: "bg-[#ead8c7] text-[#3b2924]"
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tones[resolvedTone]}`}>{label}</span>;
}
