import type { Metadata } from 'next'
import { MegaBrokerageProductPage, MEGA_BROKERAGE_DESCRIPTION } from './product-page'

export const metadata: Metadata = {
  title: 'Mega Brokerage Platform',
  description: MEGA_BROKERAGE_DESCRIPTION,
  alternates: { canonical: '/business/mega-brokerage' },
}

export default MegaBrokerageProductPage
