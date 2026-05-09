export type Product = {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  category: string;
  presentation: string;
  ingredients: string[];
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  prepHours: number;
  variants?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
};

export type OrderStatus =
  | "pendiente"
  | "confirmado"
  | "en_preparacion"
  | "listo_para_entrega"
  | "entregado"
  | "cancelado";

export type PaymentStatus = "pendiente" | "pagado" | "parcial" | "cancelado";

export type Order = {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  requestedDeliveryDate: string;
  deliveryMethod: "recoger" | "domicilio";
  deliveryAddress?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerNotes: string;
  internalNotes: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>;
};

export const products: Product[] = [
  {
    id: "alfajores-x8",
    name: "Alfajores caja x18",
    description: "Alfajores artesanales rellenos de dulce de leche.",
    longDescription:
      "Caja de alfajores suaves, rellenos de dulce de leche y terminados con una cobertura delicada para regalar o compartir.",
    price: 18000,
    category: "Alfajores",
    presentation: "Caja x18",
    ingredients: ["Harina", "Mantequilla", "Dulce de leche", "Azucar pulverizada"],
    imageUrl: "/images/Alfajores.jpeg",
    isAvailable: true,
    isFeatured: true,
    prepHours: 24
  },
  {
    id: "torta-zanahoria",
    name: "Torta de zanahoria",
    description: "Torta humeda de zanahoria en tres tamaños.",
    longDescription:
      "Torta artesanal de zanahoria, especiada y suave. Disponible en cuarto de libra, media libra y una libra.",
    price: 43000,
    category: "Tortas",
    presentation: "1/4 lb / 1/2 lb / 1 lb",
    ingredients: ["Zanahoria", "Harina", "Huevos", "Canela", "Nueces"],
    imageUrl: "/images/torta_zanahoria.jpeg",
    isAvailable: true,
    isFeatured: true,
    prepHours: 48,
    variants: [
      { id: "cuarto-libra", name: "Cuarto de libra", price: 43000 },
      { id: "media-libra", name: "Media libra", price: 53000 },
      { id: "una-libra", name: "Una libra", price: 63000 }
    ]
  },
  {
    id: "red-velvet",
    name: "Red velvet",
    description: "Torta red velvet en tres tamaños.",
    longDescription:
      "Torta red velvet suave con crema. Disponible en cuarto de libra, media libra y una libra.",
    price: 43000,
    category: "Tortas",
    presentation: "1/4 lb / 1/2 lb / 1 lb",
    ingredients: ["Harina", "Cacao", "Huevos", "Crema", "Vainilla"],
    imageUrl: "/images/Red_velvet.jpeg",
    isAvailable: true,
    isFeatured: true,
    prepHours: 48,
    variants: [
      { id: "cuarto-libra", name: "Cuarto de libra", price: 43000 },
      { id: "media-libra", name: "Media libra", price: 53000 },
      { id: "una-libra", name: "Una libra", price: 63000 }
    ]
  }
];

export const orders: Order[] = [
  {
    id: "LB-1001",
    customerName: "Maria Gomez",
    customerEmail: "maria@example.com",
    customerPhone: "300 123 4567",
    createdAt: "2026-05-07",
    requestedDeliveryDate: "2026-05-10",
    deliveryMethod: "domicilio",
    deliveryAddress: "Barrio Laureles",
    status: "pendiente",
    paymentStatus: "pendiente",
    customerNotes: "Es para regalo, por favor empacar bonito.",
    internalNotes: "Confirmar direccion por WhatsApp.",
    items: [
      { productId: "alfajores-x8", productName: "Alfajores caja x18", quantity: 2, unitPrice: 18000 }
    ]
  },
  {
    id: "LB-1002",
    customerName: "Daniel Ruiz",
    customerEmail: "daniel@example.com",
    customerPhone: "311 987 6543",
    createdAt: "2026-05-06",
    requestedDeliveryDate: "2026-05-09",
    deliveryMethod: "recoger",
    status: "en_preparacion",
    paymentStatus: "parcial",
    customerNotes: "Recoge en la tarde.",
    internalNotes: "Abono recibido.",
    items: [
      { productId: "caja-regalo", productName: "Caja de regalo surtida", quantity: 1, unitPrice: 38000 },
      { productId: "galletas-mantequilla", productName: "Galletas de mantequilla", quantity: 1, unitPrice: 18000 }
    ]
  }
];

export const productCosts = [
  { productId: "alfajores-x8", ingredients: 7200, packaging: 2100, labor: 3800, other: 900 },
  { productId: "torta-zanahoria", ingredients: 18000, packaging: 3000, labor: 8000, other: 1000 },
  { productId: "red-velvet", ingredients: 18000, packaging: 3000, labor: 8000, other: 1000 }
];

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);
}

export function orderTotal(order: Order) {
  return order.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
}

export function getProduct(id: string) {
  return products.find((product) => product.id === id);
}

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_preparacion: "En preparación",
  listo_para_entrega: "Listo p/entrega",
  entregado: "Entregado",
  cancelado: "Cancelado",
  pagado: "Pagado",
  parcial: "Pago parcial"
};

export function formatStatus(status: string): string {
  return STATUS_LABELS[status] || status;
}
