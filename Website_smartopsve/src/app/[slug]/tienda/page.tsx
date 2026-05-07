import { notFound } from 'next/navigation';
import { getTenantProducts } from '@/lib/tenantApi';
import TiendaClient from './TiendaClient';

export const dynamic = 'force-dynamic';

function formatPrice(raw: any, currency?: string) {
  const value = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
  if (!Number.isFinite(value)) return 'Consultar precio';
  const cur = (currency || 'USD').toUpperCase();
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: cur, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

export default async function TiendaPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  try {
    const result = await getTenantProducts(slug);
    const products =
      Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.products)
            ? result.products
            : [];

    if (!products) notFound();

    return <TiendaClient products={products} slug={slug} />;
  } catch (error) {
    console.error('Error cargando productos de la tienda:', { slug, error: String(error) });
    notFound();
  }
}
