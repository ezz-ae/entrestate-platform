/**
 * A real screen recording of the product, framed like the stills. The clips
 * are small H.264 loops (80–180KB — lighter than a screenshot), recorded from
 * the skyline demo workspace, so what plays is the actual product on actual
 * inventory. Muted + playsInline keeps mobile browsers happy; the loop is the
 * whole story, so there are no controls to manage.
 */

import { Browser } from '@/components/business/visuals'

export function Clip({
  src,
  title,
  className = '',
}: {
  src: string
  /** The address shown in the Browser chrome, e.g. "app.skyline…/launch". */
  title: string
  className?: string
}) {
  return (
    <Browser title={title} className={className}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- silent UI loop */}
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="block w-full"
      />
    </Browser>
  )
}
