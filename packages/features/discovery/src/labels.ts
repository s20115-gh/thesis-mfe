import type { VenueCategory } from '@thesis/contracts'
import type { VenueSort } from '@thesis/data'

export const categoryLabels: Record<VenueCategory, string> = {
  hair: 'Hair',
  barber: 'Barber',
  nails: 'Nails',
  spa: 'Spa & massage',
  makeup: 'Makeup & lashes',
}

export const sortLabels: Record<VenueSort, string> = {
  rating: 'Top rated',
  price: 'Lowest price',
  name: 'Name (A–Z)',
}
