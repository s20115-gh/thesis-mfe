import type { FeatureProps, UserRole } from '@thesis/contracts'
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export type FeatureName =
  | 'discovery'
  | 'venue'
  | 'booking'
  | 'checkout'
  | 'account'
  | 'calendar'
  | 'catalog-staff'
  | 'analytics'

export type Feature = {
  name: FeatureName
  title: string
  /** Where the shell mounts the feature; it owns everything below. */
  basePath: string
  /** 'public', any signed-in user, or a specific role. */
  access: 'public' | 'signed-in' | UserRole
  /**
   * Loaded on first navigation to `basePath`, so each feature is its own
   * chunk. The import paths must be written out literally for Vite to split
   * them.
   */
  Routes: LazyExoticComponent<ComponentType<FeatureProps>>
}

/**
 * Every feature module and where it lives. The router and the navigation are
 * both built from this list.
 */
export const features: Feature[] = [
  {
    name: 'discovery',
    title: 'Find a salon',
    basePath: '/salons',
    access: 'public',
    Routes: lazy(() => import('@thesis/feature-discovery')),
  },
  {
    name: 'venue',
    title: 'Venue profile',
    basePath: '/venues',
    access: 'public',
    Routes: lazy(() => import('@thesis/feature-venue')),
  },
  {
    name: 'booking',
    title: 'Booking',
    basePath: '/book',
    access: 'signed-in',
    Routes: lazy(() => import('@thesis/feature-booking')),
  },
  {
    name: 'checkout',
    title: 'Checkout',
    basePath: '/checkout',
    access: 'signed-in',
    Routes: lazy(() => import('@thesis/feature-checkout')),
  },
  {
    name: 'account',
    title: 'My bookings',
    basePath: '/account',
    access: 'signed-in',
    Routes: lazy(() => import('@thesis/feature-account')),
  },
  {
    name: 'calendar',
    title: 'Calendar',
    basePath: '/merchant/calendar',
    access: 'merchant',
    Routes: lazy(() => import('@thesis/feature-calendar')),
  },
  {
    name: 'catalog-staff',
    title: 'Catalog',
    basePath: '/merchant/catalog',
    access: 'merchant',
    Routes: lazy(() => import('@thesis/feature-catalog-staff')),
  },
  {
    name: 'analytics',
    title: 'Analytics',
    basePath: '/merchant/analytics',
    access: 'merchant',
    Routes: lazy(() => import('@thesis/feature-analytics')),
  },
]

export const feature = (name: FeatureName): Feature => features.find((f) => f.name === name)!
