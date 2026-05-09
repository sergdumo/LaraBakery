import { AdminOrderDetail } from "./admin-order-detail";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdminOrderDetail id={id} />;
}
