import React, { useEffect, useState } from 'react'
import { Modal } from '../ui/modal'
import { PlanChangeForm } from '../forms/PlanChangeForm'
import { useFeatures } from '../../lib/FeaturesContext'
import { getCurrentSubscription } from '../../lib/subscriptionsApi'

export default function PaymentRequiredModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void> | void
}) {
  const { subscriptionPlanId, subscriptionStatus } = useFeatures()

  const [subscription, setSubscription] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    let isCancelled = false

    async function load() {
      setLoading(true)
      try {
        const sub = await getCurrentSubscription()
        if (!isCancelled) setSubscription(sub)
      } catch {
        if (!isCancelled) setSubscription(null)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    if (isOpen) {
      load()
    } else {
      setSubscription(null)
      setLoading(false)
    }

    return () => {
      isCancelled = true
    }
  }, [isOpen])

  const effectiveStatus = subscription?.status || subscriptionStatus || 'pendiente'
  const preselected = subscriptionPlanId || subscription?.plan?._id

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pago requerido" size="lg">
      <div className="p-6 space-y-4">
        <p className="font-montserrat text-smartops-dark">
          Tu suscripción está <strong>{effectiveStatus}</strong>. Para activar los módulos del plan,
          completa el pago y adjunta el comprobante.
        </p>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-smartops-blue"></div>
          </div>
        ) : (
          <PlanChangeForm
            isOpen={isOpen}
            onClose={onClose}
            onSuccess={onSuccess}
            currentPlan={subscription?.plan}
            preselectedPlanId={preselected}
          />
        )}
      </div>
    </Modal>
  )
}