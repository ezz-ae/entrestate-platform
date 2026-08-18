/**
 * The old Listing-to-Landing path, kept alive for one reason.
 *
 * The product is now the Mega Brokerage Platform at /business/mega-brokerage,
 * and next.config.mjs sends this path there with a 308 — so a browser typing
 * the old URL never reaches this file.
 *
 * The file still has to exist. PRODUCT_DOORS in lib/tenancy/vendor-host.ts
 * REWRITES listing. / listings. / landing. / landings.entrestate.com to
 * /business/listing-to-landing, and the whole point of a rewrite is that the
 * short address stays in the bar. That rewrite is done by proxy.ts, which runs
 * AFTER next.config redirects and is resolved against the filesystem — delete
 * this route and those four hostnames answer 404 instead of the product.
 *
 * So the door renders the renamed page itself. The canonical below points at
 * the new path, which is what stops one page ranking as two.
 */
import type { Metadata } from 'next'
import { MegaBrokerageProductPage, MEGA_BROKERAGE_DESCRIPTION } from '../mega-brokerage/product-page'

export const metadata: Metadata = {
  title: 'Mega Brokerage Platform',
  description: MEGA_BROKERAGE_DESCRIPTION,
  alternates: { canonical: '/business/mega-brokerage' },
}

export default MegaBrokerageProductPage
