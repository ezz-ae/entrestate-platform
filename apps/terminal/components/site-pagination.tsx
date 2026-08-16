import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

export type SitePaginationItem = {
  key: string
  label: string
  href?: string | null
  active?: boolean
  ellipsis?: boolean
}

type SitePaginationProps = {
  summary: string
  previousHref?: string | null
  nextHref?: string | null
  previousLabel: string
  nextLabel: string
  items: SitePaginationItem[]
}

export function SitePagination({
  summary,
  previousHref,
  nextHref,
  previousLabel,
  nextLabel,
  items,
}: SitePaginationProps) {
  if (!previousHref && !nextHref && items.length <= 1) return null

  return (
    <div className="mt-8 rounded-2xl border border-border/60 bg-card/50 px-4 py-4 md:px-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-muted-foreground">{summary}</p>

        <Pagination className="mx-0 w-auto justify-start md:justify-end">
          <PaginationContent>
            <PaginationItem>
              {previousHref ? (
                <Link
                  href={previousHref}
                  className={cn(buttonVariants({ variant: "ghost", size: "default" }), "gap-1 px-2.5 sm:pl-2.5")}
                  aria-label={previousLabel}
                >
                  <ChevronLeftIcon className="size-4" />
                  <span className="hidden sm:block">{previousLabel}</span>
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "default" }),
                    "cursor-not-allowed gap-1 px-2.5 opacity-40 sm:pl-2.5",
                  )}
                >
                  <ChevronLeftIcon className="size-4" />
                  <span className="hidden sm:block">{previousLabel}</span>
                </span>
              )}
            </PaginationItem>

            {items.map((item) => (
              <PaginationItem key={item.key}>
                {item.ellipsis ? (
                  <PaginationEllipsis />
                ) : item.href ? (
                  <Link
                    href={item.href}
                    aria-current={item.active ? "page" : undefined}
                    className={cn(
                      buttonVariants({
                        variant: item.active ? "outline" : "ghost",
                        size: "icon",
                      }),
                    )}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={item.active ? "page" : undefined}
                    className={cn(
                      buttonVariants({
                        variant: item.active ? "outline" : "ghost",
                        size: "icon",
                      }),
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              {nextHref ? (
                <Link
                  href={nextHref}
                  className={cn(buttonVariants({ variant: "ghost", size: "default" }), "gap-1 px-2.5 sm:pr-2.5")}
                  aria-label={nextLabel}
                >
                  <span className="hidden sm:block">{nextLabel}</span>
                  <ChevronRightIcon className="size-4" />
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "default" }),
                    "cursor-not-allowed gap-1 px-2.5 opacity-40 sm:pr-2.5",
                  )}
                >
                  <span className="hidden sm:block">{nextLabel}</span>
                  <ChevronRightIcon className="size-4" />
                </span>
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
