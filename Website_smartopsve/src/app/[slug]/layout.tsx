export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="tenant-layout" suppressHydrationWarning>
      {children}
    </div>
  );
}