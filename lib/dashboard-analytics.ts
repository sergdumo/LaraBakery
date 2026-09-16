export type DashboardOrder = {
  requestedDeliveryDate: string;
  status: string;
  paymentStatus: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
};

export type DashboardProductCost = {
  productId: string;
  ingredients: number;
  packaging: number;
  labor: number;
  other: number;
};

export type AnnualMonthSummary = {
  month: number;
  revenue: number;
  paidRevenue: number;
  estimatedCost: number;
  estimatedProfit: number;
  orders: number;
  units: number;
  cumulativeRevenue: number;
};

export type AnnualProductSummary = {
  id: string;
  name: string;
  units: number;
  unitsWithRegisteredCost: number;
  costCoverage: number;
  revenue: number;
  estimatedCost: number;
  estimatedProfit: number;
  margin: number | null;
};

export type AnnualActivityDay = {
  date: string;
  month: number;
  day: number;
  orders: number;
  revenue: number;
};

export type AnnualDashboardData = {
  year: number;
  revenue: number;
  paidRevenue: number;
  estimatedCost: number;
  estimatedProfit: number;
  profitMargin: number;
  orders: number;
  averageTicket: number;
  totalUnits: number;
  unitsWithRegisteredCost: number;
  costCoverage: number;
  months: AnnualMonthSummary[];
  products: AnnualProductSummary[];
  activity: AnnualActivityDay[];
};

function totalOrder(order: DashboardOrder) {
  return order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

function totalProductCost(cost?: DashboardProductCost) {
  if (!cost) return 0;
  return cost.ingredients + cost.packaging + cost.labor + cost.other;
}

function periodFromDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > new Date(year, month, 0).getDate()) return null;
  return { year, month, day };
}

export function buildAnnualDashboard(
  orders: DashboardOrder[],
  productCosts: DashboardProductCost[],
  year: number
): AnnualDashboardData {
  const costsByProduct = new Map(productCosts.map((cost) => [cost.productId, totalProductCost(cost)]));
  const months: AnnualMonthSummary[] = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    revenue: 0,
    paidRevenue: 0,
    estimatedCost: 0,
    estimatedProfit: 0,
    orders: 0,
    units: 0,
    cumulativeRevenue: 0
  }));
  const products = new Map<string, AnnualProductSummary>();
  const activity = new Map<string, AnnualActivityDay>();
  let unitsWithRegisteredCost = 0;

  orders.forEach((order) => {
    const period = periodFromDate(order.requestedDeliveryDate);
    if (!period || period.year !== year || order.status === "cancelado") return;

    const month = months[period.month - 1];
    const orderRevenue = totalOrder(order);
    month.orders += 1;
    month.revenue += orderRevenue;
    if (order.paymentStatus === "pagado") month.paidRevenue += orderRevenue;

    const activityDay = activity.get(order.requestedDeliveryDate) || {
      date: order.requestedDeliveryDate,
      month: period.month,
      day: period.day,
      orders: 0,
      revenue: 0
    };
    activityDay.orders += 1;
    activityDay.revenue += orderRevenue;
    activity.set(order.requestedDeliveryDate, activityDay);

    order.items.forEach((item) => {
      const baseProductId = item.productId.split(":")[0];
      const productKey = item.productId;
      const unitCost = costsByProduct.get(baseProductId) || 0;
      const itemRevenue = item.quantity * item.unitPrice;
      const itemCost = item.quantity * unitCost;

      month.units += item.quantity;
      month.estimatedCost += itemCost;
      if (unitCost > 0) unitsWithRegisteredCost += item.quantity;

      const product = products.get(productKey) || {
        id: productKey,
        name: item.productName,
        units: 0,
        unitsWithRegisteredCost: 0,
        costCoverage: 0,
        revenue: 0,
        estimatedCost: 0,
        estimatedProfit: 0,
        margin: null
      };
      product.units += item.quantity;
      if (unitCost > 0) product.unitsWithRegisteredCost += item.quantity;
      product.revenue += itemRevenue;
      product.estimatedCost += itemCost;
      product.estimatedProfit = product.revenue - product.estimatedCost;
      product.costCoverage = product.units ? Math.round((product.unitsWithRegisteredCost / product.units) * 100) : 0;
      product.margin = product.revenue && product.costCoverage === 100
        ? Math.round((product.estimatedProfit / product.revenue) * 100)
        : null;
      products.set(productKey, product);
    });

    month.estimatedProfit = month.revenue - month.estimatedCost;
  });

  let cumulativeRevenue = 0;
  months.forEach((month) => {
    cumulativeRevenue += month.revenue;
    month.cumulativeRevenue = cumulativeRevenue;
  });

  const revenue = months.reduce((sum, month) => sum + month.revenue, 0);
  const paidRevenue = months.reduce((sum, month) => sum + month.paidRevenue, 0);
  const estimatedCost = months.reduce((sum, month) => sum + month.estimatedCost, 0);
  const estimatedProfit = revenue - estimatedCost;
  const annualOrders = months.reduce((sum, month) => sum + month.orders, 0);
  const totalUnits = months.reduce((sum, month) => sum + month.units, 0);

  return {
    year,
    revenue,
    paidRevenue,
    estimatedCost,
    estimatedProfit,
    profitMargin: revenue ? Math.round((estimatedProfit / revenue) * 100) : 0,
    orders: annualOrders,
    averageTicket: annualOrders ? revenue / annualOrders : 0,
    totalUnits,
    unitsWithRegisteredCost,
    costCoverage: totalUnits ? Math.round((unitsWithRegisteredCost / totalUnits) * 100) : 0,
    months,
    products: Array.from(products.values()).sort((a, b) => b.revenue - a.revenue),
    activity: Array.from(activity.values()).sort((a, b) => a.date.localeCompare(b.date))
  };
}
