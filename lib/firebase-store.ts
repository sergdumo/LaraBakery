import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase";
import { Order, OrderStatus, PaymentStatus, Product, products } from "@/lib/data";

const adminEmails = ["serdumo@gmail.com", "saralaracorrea@gmail.com"];
const legacySampleProductIds = new Set([
  "caja-regalo",
  "torta-vainilla",
  "galletas-mantequilla",
  "torta-zanahoria-pequena",
  "torta-zanahoria-mediana",
  "torta-zanahoria-grande",
  "red-velvet-pequena",
  "red-velvet-mediana",
  "red-velvet-grande"
]);

function roleForEmail(email?: string | null): "customer" | "admin" {
  return email && adminEmails.includes(email.toLowerCase()) ? "admin" : "customer";
}

export type AppUser = {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: "customer" | "admin";
  phone?: string;
};

export type NewOrderInput = {
  user: User;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requestedDeliveryDate: string;
  deliveryMethod: "recoger" | "domicilio";
  deliveryAddress?: string;
  customerNotes: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    notes: string;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
};

export type OrderItemInput = NewOrderInput["items"][number];

export type ManualOrderInput = {
  createdByUid: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requestedDeliveryDate: string;
  deliveryMethod: "recoger" | "domicilio";
  deliveryAddress?: string;
  customerNotes: string;
  internalNotes: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItemInput[];
  deliveryFee: number;
};

export type UpdateOrderDetailsInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requestedDeliveryDate: string;
  deliveryMethod: "recoger" | "domicilio";
  deliveryAddress?: string;
  customerNotes: string;
  items: OrderItemInput[];
  deliveryFee: number;
};

export async function ensureUserProfile(user: User) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  const role = roleForEmail(user.email);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      name: user.displayName || "Cliente Lara Bakery",
      email: user.email || "",
      image: user.photoURL || "",
      role,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return;
  }

  await setDoc(
    userRef,
    {
      name: user.displayName || snapshot.data().name || "Cliente Lara Bakery",
      email: user.email || snapshot.data().email || "",
      image: user.photoURL || snapshot.data().image || "",
      role: role === "admin" ? "admin" : snapshot.data().role || "customer",
      updated_at: serverTimestamp()
    },
    { merge: true }
  );
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    id: uid,
    name: String(data.name || ""),
    email: String(data.email || ""),
    image: typeof data.image === "string" ? data.image : undefined,
    role: data.role === "admin" ? "admin" : "customer",
    phone: typeof data.phone === "string" ? data.phone : undefined
  };
}

export async function getProducts(): Promise<Product[]> {
  const snapshot = await getDocs(query(collection(db, "products"), orderBy("name", "asc")));

  if (snapshot.empty) {
    return products;
  }

  const fallbackById = new Map(products.map((product) => [product.id, product]));
  const remoteProducts = snapshot.docs.flatMap((entry) => {
    if (legacySampleProductIds.has(entry.id)) {
      return [];
    }

    const data = entry.data();
    const product = {
      id: entry.id,
      name: String(data.name || ""),
      description: String(data.description || ""),
      longDescription: String(data.longDescription || data.description || ""),
      price: Number(data.price || 0),
      category: String(data.category || "Producto"),
      presentation: String(data.presentation || ""),
      ingredients: Array.isArray(data.ingredients) ? data.ingredients.map(String) : [],
      imageUrl: String(data.imageUrl || data.image_url || ""),
      isAvailable: Boolean(data.isAvailable ?? data.is_available ?? true),
      isFeatured: Boolean(data.isFeatured ?? data.is_featured ?? false),
      prepHours: Number(data.prepHours || data.prep_hours || 24),
      variants: Array.isArray(data.variants)
        ? data.variants.map((variant) => ({
            id: String(variant.id || ""),
            name: String(variant.name || ""),
            price: Number(variant.price || 0)
          }))
        : undefined
    };
    const currentMvpProduct = products.find((fallbackProduct) => fallbackProduct.id === entry.id);

    if (currentMvpProduct) {
      return [{ ...product, ...currentMvpProduct }];
    }

    return [product];
  });
  const remoteIds = new Set(remoteProducts.map((product) => product.id));
  const missingFallbackProducts = products.filter((product) => !remoteIds.has(product.id) && fallbackById.has(product.id));

  return [...remoteProducts, ...missingFallbackProducts].sort((a, b) => a.name.localeCompare(b.name));
}

export async function seedProducts() {
  const batch = writeBatch(db);

  products.forEach((product) => {
    batch.set(
      doc(db, "products", product.id),
      {
        name: product.name,
        description: product.description,
        longDescription: product.longDescription,
        price: product.price,
        category: product.category,
        presentation: product.presentation,
        ingredients: product.ingredients,
        imageUrl: product.imageUrl,
        isAvailable: product.isAvailable,
        isFeatured: product.isFeatured,
        prepHours: product.prepHours,
        variants: product.variants || [],
        isActive: true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      },
      { merge: true }
    );
  });

  await batch.commit();
}

function getColombiaDateString(): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

async function generateOrderId(): Promise<string> {
  const dateStr = getColombiaDateString();
  const counterRef = doc(db, "counters", "orders");

  const seq = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(counterRef);
    const next =
      snap.exists() && snap.data().date === dateStr
        ? (snap.data().count as number) + 1
        : 1;
    transaction.set(counterRef, { date: dateStr, count: next });
    return next;
  });

  return `LB-${dateStr}-${String(seq).padStart(2, "0")}`;
}

export async function createOrder(input: NewOrderInput) {
  const orderId = await generateOrderId();
  const orderRef = doc(db, "orders", orderId);
  const batch = writeBatch(db);

  batch.set(orderRef, {
    user_id: input.user.uid,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    status: "pendiente",
    payment_status: "pendiente",
    delivery_method: input.deliveryMethod,
    delivery_address: input.deliveryAddress || "",
    requested_delivery_date: input.requestedDeliveryDate,
    subtotal: input.subtotal,
    delivery_fee: input.deliveryFee,
    total: input.total,
    customer_notes: input.customerNotes,
    internal_notes: "",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  input.items.forEach((item) => {
    const itemRef = doc(collection(db, "orders", orderId, "items"));
    batch.set(itemRef, {
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.quantity * item.unitPrice,
      notes: item.notes
    });
  });
  await batch.commit();

  return orderId;
}

export async function createManualOrder(input: ManualOrderInput) {
  const orderId = await generateOrderId();
  const orderRef = doc(db, "orders", orderId);
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const batch = writeBatch(db);

  batch.set(orderRef, {
    user_id: "",
    created_by: input.createdByUid,
    source: "manual",
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    status: input.status,
    payment_status: input.paymentStatus,
    delivery_method: input.deliveryMethod,
    delivery_address: input.deliveryAddress || "",
    requested_delivery_date: input.requestedDeliveryDate,
    subtotal,
    delivery_fee: input.deliveryFee,
    total: subtotal + input.deliveryFee,
    customer_notes: input.customerNotes,
    internal_notes: input.internalNotes,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  input.items.forEach((item) => {
    const itemRef = doc(collection(db, "orders", orderId, "items"));
    batch.set(itemRef, {
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.quantity * item.unitPrice,
      notes: item.notes
    });
  });

  await batch.commit();
  return orderId;
}

async function getOrderItems(orderId: string) {
  const itemsSnapshot = await getDocs(collection(db, "orders", orderId, "items"));
  return itemsSnapshot.docs.map((itemDoc) => {
    const item = itemDoc.data();
    return {
      productId: String(item.product_id || ""),
      productName: String(item.product_name || ""),
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unit_price || 0),
      totalPrice: Number(item.total_price || 0),
      notes: String(item.notes || "")
    };
  });
}

function toOrder(id: string, data: Record<string, unknown>, items: Awaited<ReturnType<typeof getOrderItems>>): Order {
  return {
    id,
    userId: String(data.user_id || ""),
    customerName: String(data.customer_name || ""),
    customerEmail: String(data.customer_email || ""),
    customerPhone: String(data.customer_phone || ""),
    createdAt: typeof (data.created_at as { toDate?: unknown })?.toDate === "function"
      ? (data.created_at as { toDate: () => Date }).toDate().toISOString()
      : String(data.created_at || ""),
    requestedDeliveryDate: String(data.requested_delivery_date || ""),
    deliveryMethod: data.delivery_method === "domicilio" ? "domicilio" : "recoger",
    deliveryAddress: String(data.delivery_address || ""),
    status: String(data.status || "pendiente") as OrderStatus,
    paymentStatus: String(data.payment_status || "pendiente") as PaymentStatus,
    customerNotes: String(data.customer_notes || ""),
    internalNotes: String(data.internal_notes || ""),
    items
  };
}

export async function getOrdersForUser(uid: string): Promise<Order[]> {
  const snapshot = await getDocs(query(collection(db, "orders"), where("user_id", "==", uid), orderBy("requested_delivery_date", "desc")));
  const hydrated = await Promise.all(snapshot.docs.map(async (entry) => toOrder(entry.id, entry.data(), await getOrderItems(entry.id))));
  return hydrated;
}

export async function getAllOrders(): Promise<Order[]> {
  const snapshot = await getDocs(query(collection(db, "orders"), orderBy("created_at", "desc")));
  return Promise.all(snapshot.docs.map(async (entry) => toOrder(entry.id, entry.data(), await getOrderItems(entry.id))));
}

export async function updateOrderState(orderId: string, status: OrderStatus, paymentStatus: PaymentStatus) {
  await updateDoc(doc(db, "orders", orderId), {
    status,
    payment_status: paymentStatus,
    updated_at: serverTimestamp()
  });
}

export async function updateOrderDetails(orderId: string, input: UpdateOrderDetailsInput) {
  const orderRef = doc(db, "orders", orderId);
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const batch = writeBatch(db);
  const existingItems = await getDocs(collection(db, "orders", orderId, "items"));

  batch.update(orderRef, {
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    delivery_method: input.deliveryMethod,
    delivery_address: input.deliveryAddress || "",
    requested_delivery_date: input.requestedDeliveryDate,
    subtotal,
    delivery_fee: input.deliveryFee,
    total: subtotal + input.deliveryFee,
    customer_notes: input.customerNotes,
    updated_at: serverTimestamp()
  });

  existingItems.docs.forEach((itemDoc) => batch.delete(itemDoc.ref));
  input.items.forEach((item) => {
    const itemRef = doc(collection(db, "orders", orderId, "items"));
    batch.set(itemRef, {
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.quantity * item.unitPrice,
      notes: item.notes
    });
  });

  await batch.commit();
}

export async function deleteOrder(orderId: string) {
  const batch = writeBatch(db);
  const items = await getDocs(collection(db, "orders", orderId, "items"));

  items.docs.forEach((itemDoc) => batch.delete(itemDoc.ref));
  await batch.commit();
  await deleteDoc(doc(db, "orders", orderId));
}

export type ProductCostEntry = {
  productId: string;
  ingredients: number;
  packaging: number;
  labor: number;
  other: number;
};

export async function getProductCosts(): Promise<ProductCostEntry[]> {
  const snapshot = await getDocs(collection(db, "product_costs"));
  return snapshot.docs.map((entry) => {
    const data = entry.data();
    return {
      productId: entry.id,
      ingredients: Number(data.ingredients ?? data.ingredient_cost ?? 0),
      packaging: Number(data.packaging ?? data.packaging_cost ?? 0),
      labor: Number(data.labor ?? data.labor_cost ?? 0),
      other: Number(data.other ?? data.other_cost ?? 0)
    };
  });
}

export async function saveProductCost(productId: string, cost: Omit<ProductCostEntry, "productId">) {
  await setDoc(
    doc(db, "product_costs", productId),
    {
      ingredients: cost.ingredients,
      packaging: cost.packaging,
      labor: cost.labor,
      other: cost.other,
      total_cost: cost.ingredients + cost.packaging + cost.labor + cost.other,
      updated_at: serverTimestamp()
    },
    { merge: true }
  );
}

export async function getOrderById(id: string): Promise<Order | null> {
  const snapshot = await getDoc(doc(db, "orders", id));
  if (!snapshot.exists()) return null;
  const items = await getOrderItems(id);
  return toOrder(id, snapshot.data() as Record<string, unknown>, items);
}

export async function updateProduct(
  id: string,
  fields: Partial<Omit<Product, "id" | "ingredients" | "longDescription">>
) {
  await updateDoc(doc(db, "products", id), { ...fields, updated_at: serverTimestamp() });
}

export async function createProduct(product: Omit<Product, "id">): Promise<string> {
  const ref = doc(collection(db, "products"));
  await setDoc(ref, {
    name: product.name,
    description: product.description,
    longDescription: product.longDescription || product.description,
    price: product.price,
    category: product.category,
    presentation: product.presentation,
    ingredients: product.ingredients,
    imageUrl: product.imageUrl,
    isAvailable: product.isAvailable,
    isFeatured: product.isFeatured,
    prepHours: product.prepHours,
    variants: product.variants || [],
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return ref.id;
}

export async function updateOrderInternalNotes(orderId: string, notes: string) {
  await updateDoc(doc(db, "orders", orderId), {
    internal_notes: notes,
    updated_at: serverTimestamp()
  });
}
