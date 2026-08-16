export function parsePageParam(value: string | undefined) {
  if (!value) return 1
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return Math.floor(parsed)
}

export function clampPage(page: number, totalPages: number) {
  const safeTotal = Math.max(totalPages, 1)
  return Math.min(Math.max(page, 1), safeTotal)
}

export function buildPaginationWindow(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-right", totalPages] as const
  }

  if (currentPage >= totalPages - 3) {
    return [1, "ellipsis-left", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const
  }

  return [1, "ellipsis-left", currentPage - 1, currentPage, currentPage + 1, "ellipsis-right", totalPages] as const
}
