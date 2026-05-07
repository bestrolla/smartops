import { notFound } from 'next/navigation';
import { getTenantProfile } from '@/lib/tenantApi';
import TenantProfileClient from './TenantProfileClient';

export const dynamic = 'force-dynamic'; // fuerza SSR en Cloud Run para cualquier slug

export default async function TenantProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  const data = await getTenantProfile(slug);
  if (!data) {
    // Log diagnóstico para Cloud Run
    console.error('Error inesperado al cargar perfil:', {
      slug,
      ts: new Date().toISOString(),
    });
    notFound();
  }

  return <TenantProfileClient profileData={data} />;
}