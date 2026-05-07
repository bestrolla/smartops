import React, { createContext, useContext, useEffect, useState } from 'react'
import api from './api'

type FeaturesMap = Record<string, boolean>
type SubscriptionStatus = string

interface FeaturesContextType {
  loading: boolean
  features: FeaturesMap
  requiresPayment: boolean
  subscriptionStatus?: SubscriptionStatus
  subscriptionPlanId?: string
  refreshFeatures: () => Promise<void>
  isFeatureEnabled: (featureName: string) => boolean
}

const FeaturesContext = createContext<FeaturesContextType>({
  loading: false,
  features: {},
  requiresPayment: false,
  refreshFeatures: async () => {},
  isFeatureEnabled: () => false,
})

export function FeaturesProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState<boolean>(true)
  const [features, setFeatures] = useState<FeaturesMap>({})
  const [requiresPayment, setRequiresPayment] = useState<boolean>(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | undefined>(undefined)
  const [subscriptionPlanId, setSubscriptionPlanId] = useState<string | undefined>(undefined)

  const fetchFeatures = async () => {
    setLoading(true)
    try {
      // Usar Axios para incluir Authorization y baseURL
      const res = await api.get('/tenants/features')
      // El backend devuelve { status, data: { ... } }
      const payload = res.data?.data || res.data

      setFeatures(payload?.features || {})
      setRequiresPayment(Boolean(payload?.requiresPayment))
      setSubscriptionStatus(payload?.subscriptionStatus)
      setSubscriptionPlanId(payload?.planId || payload?.subscriptionPlanId)
    } catch (err) {
      setFeatures({})
      setRequiresPayment(false)
      setSubscriptionStatus(undefined)
      setSubscriptionPlanId(undefined)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeatures()
  }, [])

  const value: FeaturesContextType = {
    loading,
    features,
    requiresPayment,
    subscriptionStatus,
    subscriptionPlanId,
    refreshFeatures: fetchFeatures,
    isFeatureEnabled: (featureName: string) => Boolean(features[featureName]),
  }

  return (
    <FeaturesContext.Provider value={value}>
      {children}
    </FeaturesContext.Provider>
  )
}

export function useFeatures(): FeaturesContextType {
  return useContext(FeaturesContext)
}