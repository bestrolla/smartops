'use client'

import { useState, useMemo } from 'react'
import { ShoppingCart, Plus, Minus } from 'lucide-react'

type Props = { products: any[]; slug: string }

function formatPrice(raw: any, currency?: string) {
  const value = typeof raw === 'string' ? parseFloat(raw) : Number(raw)
  if (!Number.isFinite(value)) return 'Consultar precio'
  const cur = (currency || 'USD').toUpperCase()
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: cur, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
}

export default function TiendaClient({ products, slug }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<Record<string, { product: any; qty: number }>>({})
  const [selectedQty, setSelectedQty] = useState(1)

  const normalized = useMemo(() => Array.isArray(products) ? products : [], [products])

  const onConsult = (p: any) => {
    setSelected(p)
    setOpen(true)
    setSelectedQty(1)
  }

  const close = () => {
    setOpen(false)
    setSelected(null)
  }

  

  const getId = (p: any) => (p._id || p.id)
  const addToCart = (p: any, count = 1) => {
    const id = getId(p)
    setCart(prev => {
      const next = { ...prev }
      const current = next[id]
      next[id] = { product: p, qty: (current?.qty || 0) + count }
      return next
    })
  }
  const removeOne = (id: string) => {
    setCart(prev => {
      const next = { ...prev }
      const current = next[id]
      if (!current) return prev
      const newQty = current.qty - 1
      if (newQty <= 0) {
        delete next[id]
      } else {
        next[id] = { product: current.product, qty: newQty }
      }
      return next
    })
  }
  const totalQty = useMemo(() => Object.values(cart).reduce((acc, it) => acc + it.qty, 0), [cart])
  const getNumericPrice = (p: any) => {
    const raw = typeof p?.basePrice !== 'undefined' ? p.basePrice : p?.price
    return typeof raw === 'string' ? parseFloat(raw) : Number(raw)
  }
  const totalAmount = useMemo(() => {
    return Object.values(cart).reduce((acc, it) => acc + getNumericPrice(it.product) * it.qty, 0)
  }, [cart])

  const buildCheckoutUrl = () => {
    const items = Object.entries(cart)
      .map(([id, it]) => `${encodeURIComponent(id)}:${it.qty}`)
      .join(',')
    return `/${slug}/checkout?items=${items}`
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-md mx-auto bg-white shadow-2xl min-h-screen">
        <div className="px-4 py-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 font-montserrat">Tienda</h1>
            <a href={`/${slug}`} className="text-sm font-montserrat text-blue-600 hover:text-blue-700">Volver</a>
          </div>

          {normalized.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {normalized.map((product: any) => {
                const image = Array.isArray(product?.images) && product.images.length > 0 ? product.images[0] : product?.image || null
                const imageUrl = typeof image === 'string' ? image : image?.url || ''
                const price = typeof product?.basePrice !== 'undefined' ? product.basePrice : product?.price
                return (
                <div key={product.id || product._id || product.sku || product.name} className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  {imageUrl ? (
                    <img src={imageUrl} alt={product.name} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500">Sin imagen</div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 font-montserrat">{product.name}</h3>
                    {product.sku && <p className="text-xs text-gray-500 font-montserrat mt-1">SKU: {product.sku}</p>}
                    {product.description && (
                      <p className="text-sm text-gray-600 font-montserrat mt-2 line-clamp-3">{product.description}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900 font-montserrat">{formatPrice(price, product?.currency)}</span>
                      {typeof product?.stock !== 'undefined' && (
                        <span className={`text-xs font-montserrat ${Number(product.stock) > 0 ? 'text-green-600' : 'text-red-600'}`}>{Number(product.stock) > 0 ? `${product.stock} en stock` : 'Sin stock'}</span>
                      )}
                    </div>
                    <div className="mt-4">
                      <button onClick={() => onConsult(product)} className="w-full px-3 py-2 rounded-lg bg-gray-900 text-white font-montserrat font-semibold hover:bg-gray-800">Consultar</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600 font-montserrat">Aún no hay productos publicados.</p>
            <a href={`/${slug}`} className="inline-block mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white font-montserrat font-semibold hover:bg-blue-700">Volver al perfil</a>
          </div>
        )}
        </div>
      </div>

      <button onClick={() => setCartOpen(true)} className="fixed bottom-4 right-4 z-40 rounded-full bg-blue-600 text-white p-3 shadow-lg hover:bg-blue-700">
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          {totalQty > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">{totalQty}</span>
          )}
        </div>
      </button>

      {open && selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-montserrat text-gray-900">{selected.name}</h2>
              <button onClick={close} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="mt-4">
              {(() => {
                const image = Array.isArray(selected?.images) && selected.images.length > 0 ? selected.images[0] : selected?.image || null
                const imageUrl = typeof image === 'string' ? image : image?.url || ''
                return imageUrl ? <img src={imageUrl} alt={selected.name} className="w-full h-40 object-cover rounded" /> : <div className="w-full h-40 bg-gray-200 rounded flex items-center justify-center text-gray-500">Sin imagen</div>
              })()}
              <div className="mt-4 space-y-2">
                {selected?.sku && <div className="text-xs text-gray-500 font-montserrat">SKU: {selected.sku}</div>}
                <div className="text-base font-bold text-gray-900 font-montserrat">{formatPrice(typeof selected?.basePrice !== 'undefined' ? selected.basePrice : selected?.price, selected?.currency)}</div>
                {typeof selected?.stock !== 'undefined' && <div className={`text-xs font-montserrat ${Number(selected.stock) > 0 ? 'text-green-600' : 'text-red-600'}`}>{Number(selected.stock) > 0 ? `${selected.stock} en stock` : 'Sin stock'}</div>}
                {selected?.category?.name && <div className="text-xs text-gray-600 font-montserrat">Categoría: {selected.category.name}</div>}
                {selected?.description && <div className="text-sm text-gray-700 font-montserrat leading-relaxed">{selected.description}</div>}
                <div className="mt-3">
                  <div className="text-xs text-gray-700 font-montserrat mb-2">Unidades</div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedQty(q => Math.max(1, q - 1))} className="px-3 py-1 rounded bg-gray-200 text-gray-800">-</button>
                    <div className="min-w-[40px] text-center text-sm font-montserrat">{selectedQty}</div>
                    <button onClick={() => setSelectedQty(q => {
                      const max = Number.isFinite(Number(selected?.stock)) ? Math.max(1, Number(selected.stock)) : 99
                      return Math.min(max, q + 1)
                    })} className="px-3 py-1 rounded bg-gray-200 text-gray-800">+</button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-montserrat">Subtotal</span>
                    <span className="text-base font-bold text-gray-900 font-montserrat">{formatPrice(getNumericPrice(selected) * selectedQty, selected?.currency)}</span>
                  </div>
                  {Number.isFinite(Number(selected?.stock)) && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-montserrat">Quedan</span>
                      <span className="text-sm font-semibold text-gray-900 font-montserrat">{Math.max(0, Number(selected.stock) - selectedQty)} unidades</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={close} className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-montserrat font-semibold hover:bg-gray-50">Cerrar</button>
              <button onClick={() => { addToCart(selected, selectedQty); close(); }} disabled={Number(selected?.stock) <= 0} className={`w-full px-4 py-2 rounded-lg text-white font-montserrat font-semibold ${Number(selected?.stock) <= 0 ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>Agregar</button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed inset-0 z-50 ${cartOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)}></div>
        <div className={`absolute right-0 top-0 h-full w-[85%] sm:w-[400px] bg-white shadow-2xl transform transition-transform duration-300 ${cartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-bold font-montserrat text-gray-900">Carrito</h3>
            <button onClick={() => setCartOpen(false)} className="text-gray-600 hover:text-gray-800">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {Object.entries(cart).length === 0 ? (
              <div className="text-center text-gray-600 font-montserrat">Carrito vacío</div>
            ) : (
              Object.entries(cart).map(([id, item]) => {
                const p = item.product
                const image = Array.isArray(p?.images) && p.images.length > 0 ? p.images[0] : p?.image || null
                const imageUrl = typeof image === 'string' ? image : image?.url || ''
                const price = getNumericPrice(p)
                return (
                  <div key={id} className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
                    {imageUrl ? (
                      <img src={imageUrl} alt={p.name} className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-200"></div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900 font-montserrat">{p.name}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <button onClick={() => removeOne(id)} className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700">
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="text-xs text-gray-600 font-montserrat">Cantidad: {item.qty}</div>
                        <button onClick={() => addToCart(p)} className="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-900 font-montserrat">{formatPrice(price, p?.currency)}</div>
                    </div>
                    
                  </div>
                )
              })
            )}
          </div>
          <div className="p-4 border-t border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 font-montserrat">Total</span>
              <span className="text-base font-bold text-gray-900 font-montserrat">{formatPrice(totalAmount)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setCart({})} className="w-full px-4 py-2 rounded-lg bg-red-600 text-white font-montserrat font-semibold hover:bg-red-700">Vaciar carrito</button>
              <a href={buildCheckoutUrl()} className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-montserrat font-semibold text-center hover:bg-blue-700">Checkout</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
