import { basePaths, type FeatureProps, type UserRole } from '@thesis/contracts'
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
    basePath: basePaths.discovery,
    access: 'public',
    Routes: lazy(() => import('@thesis/feature-discovery')),
  },
  {
    name: 'venue',
    title: 'Venue profile',
    basePath: basePaths.venue,
    access: 'public',
    Routes: lazy(() => import('@thesis/feature-venue')),
  },
  {
    name: 'booking',
    title: 'Booking',
    basePath: basePaths.booking,
    access: 'signed-in',
    Routes: lazy(() => import('@thesis/feature-booking')),
  },
  {
    name: 'checkout',
    title: 'Checkout',
    basePath: basePaths.checkout,
    access: 'signed-in',
    Routes: lazy(() => import('@thesis/feature-checkout')),
  },
  {
    name: 'account',
    title: 'My bookings',
    basePath: basePaths.account,
    access: 'signed-in',
    Routes: lazy(() => import('@thesis/feature-account')),
  },
  {
    name: 'calendar',
    title: 'Calendar',
    basePath: basePaths.calendar,
    access: 'merchant',
    Routes: lazy(() => import('@thesis/feature-calendar')),
  },
  {
    name: 'catalog-staff',
    title: 'Catalog',
    basePath: basePaths.catalogStaff,
    access: 'merchant',
    Routes: lazy(() => import('@thesis/feature-catalog-staff')),
  },
  {
    name: 'analytics',
    title: 'Analytics',
    basePath: basePaths.analytics,
    access: 'merchant',
    Routes: lazy(() => import('@thesis/feature-analytics')),
  },
]

export const feature = (name: FeatureName): Feature => features.find((f) => f.name === name)!
