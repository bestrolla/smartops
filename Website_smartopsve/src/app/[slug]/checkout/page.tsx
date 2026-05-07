"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";

const CATALOG: Record<string, { name: string; price: number }> = {
  "68c20e8470eeae30a54e23bd": { name: "paul", price: 1000 },
};

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const slug = String(params?.slug || "");

  const [adding, setAdding] = useState(false);
  const [addErrors, setAddErrors] = useState<string[]>([]);
  const [cart, setCart] = useState<any>(null);
  const [method, setMethod] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [submitResult, setSubmitResult] = useState<any>(null);
  

  const itemsParam = searchParams.get("items") || "";

  const parsedItems = useMemo(() => {
    if (!itemsParam) return [] as { id: string; name?: string; price?: number; qty: number; variantId?: string }[];
    return itemsParam
      .split(",")
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const [left, rawQty] = pair.split(":");
        const [rawLeft, rawVariant] = left.split("@");
        const [rawId, rawName, rawPrice] = String(rawLeft || "").split("|");
        const id = decodeURIComponent(rawId || "");
        const name = rawName ? decodeURIComponent(rawName) : undefined;
        const variantId = rawVariant ? decodeURIComponent(rawVariant) : undefined;
        const price = rawPrice ? Number(String(rawPrice).replace(",", ".")) : undefined;
        const qty = Math.max(1, Number(rawQty || 1));
        return { id, name, price, qty, variantId };
      });
  }, [itemsParam]);

  const fetchCart = async () => {
    try {
      let items: any[] = [];
      const key = `cart:${slug}`;
      if (typeof window !== "undefined") {
        const ls = window.localStorage.getItem(key);
        if (ls) {
          try {
            const parsed = JSON.parse(ls);
            items = Array.isArray(parsed?.items) ? parsed.items : [];
          } catch {}
        }
      }
      if (!items.length && parsedItems.length) {
        items = parsedItems.map((it) => {
          const fallback = CATALOG[it.id];
          const name = it.name || fallback?.name || it.id;
          const price = typeof it.price === "number" ? it.price : fallback?.price || 0;
          return { product: { name, price }, quantity: it.qty };
        });
      }
      const total = items.reduce((acc, it: any) => acc + ((it?.product?.price || 0) * (it?.quantity || 1)), 0);
      setCart({ items, total });
    } catch (e: any) {
      setCart({ items: [], total: 0 });
    }
  };

  

  useEffect(() => {
    const addItemsToCart = async () => {
      if (!parsedItems.length) {
        fetchCart();
        return;
      }
      setAdding(true);
      setAddErrors([]);
      try {
        const items = parsedItems.map((it) => {
          const fallback = CATALOG[it.id];
          const name = it.name || fallback?.name || it.id;
          const price = typeof it.price === "number" ? it.price : fallback?.price || 0;
          return { product: { name, price }, quantity: it.qty };
        });
        const total = items.reduce((acc, it: any) => acc + ((it?.product?.price || 0) * (it?.quantity || 1)), 0);
        const cartObj = { items, total };
        setCart(cartObj);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(`cart:${slug}`, JSON.stringify(cartObj));
        }
      } finally {
        setAdding(false);
      }
    };
    addItemsToCart();
  }, [itemsParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitResult(null);
    try {
      const orderNumber = `ORD-${Date.now()}`;
      setSubmitResult({ order: { orderNumber } });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(`cart:${slug}`);
      }
      setCart({ items: [], total: 0 });
    } catch (err: any) {
      setSubmitError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-md mx-auto bg-white shadow-2xl min-h-screen">
        <div className="px-6 py-4">
          <h1 className="text-lg font-bold font-montserrat text-gray-900">Checkout</h1>

          {adding && (
            <div className="mt-3 text-xs text-gray-600 font-montserrat">Añadiendo items al carrito…</div>
          )}

          {!!addErrors.length && (
            <div className="mt-3 p-3 rounded bg-red-50 text-red-700 text-xs font-montserrat">
              {addErrors.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
            </div>
          )}

          <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 font-montserrat">Resumen del carrito</span>
              <button
                onClick={fetchCart}
                className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800 font-montserrat"
              >
                Actualizar
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {(cart?.items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="text-gray-900 font-montserrat">
                    {item?.product?.name || "Producto"}
                  </div>
                  <div className="text-gray-700 font-montserrat">
                    x{item?.quantity || 1} · $
                    {(((item?.product?.price || 0) * (item?.quantity || 1)) || 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-700 font-montserrat">Total</span>
              <span className="text-base font-bold text-gray-900 font-montserrat">
                ${(cart?.total || 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-700 font-montserrat mb-1">Nombre</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-montserrat"
                  placeholder="Nombre"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 font-montserrat mb-1">Apellido</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-montserrat"
                  placeholder="Apellido"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-700 font-montserrat mb-1">Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-montserrat"
                placeholder="Ej. +58 000 0000000"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-700 font-montserrat mb-1">Método de pago</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-montserrat"
              >
                <option value="">Selecciona…</option>
                <option value="binance">Binance</option>
                <option value="zinli">Zinli</option>
                <option value="pago_movil">Pago Móvil</option>
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-700 font-montserrat mb-1">Comprobante de pago</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) { setReceiptFile(null); return; }
                  const max = 5 * 1024 * 1024;
                  if (file.size > max) {
                    setSubmitError("El archivo excede 5MB");
                    e.currentTarget.value = "";
                    setReceiptFile(null);
                    return;
                  }
                  setSubmitError("");
                  setReceiptFile(file);
                }}
                className="w-full text-sm font-montserrat"
              />
            </div>

            {submitError && (
              <div className="p-3 rounded bg-red-50 text-red-700 text-xs font-montserrat">{submitError}</div>
            )}

            {submitResult && (
              <div className="p-3 rounded bg-green-50 text-green-700 text-xs font-montserrat">
                Checkout completado. Orden {submitResult?.order?.orderNumber}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-montserrat font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Procesando…" : "Enviar comprobante"}
            </button>
          </form>

          <div className="mt-6">
            <button
              onClick={() => router.push(`/${slug}/tienda`)}
              className="w-full rounded-lg bg-gray-200 text-gray-900 px-4 py-2 font-montserrat font-semibold hover:bg-gray-300"
            >
              Volver a la tienda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

