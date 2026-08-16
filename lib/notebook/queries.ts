import "server-only"
import { prisma } from "@/lib/prisma"

export type BookType = "client" | "area" | "project" | "portfolio"
export type BookPageType = "overview" | "transactions" | "comparison" | "opportunity" | "risk" | "memo" | "content"
export type BookPageStatus = "pending" | "generating" | "ready" | "error"

export type BookSummary = {
  id: string
  title: string
  subject: string
  type: BookType
  metadata: Record<string, unknown> | null
  lastFedAt: string | null
  createdAt: string
  updatedAt: string
  pageCount: number
  feedCount: number
}

export type BookPage = {
  id: string
  bookId: string
  type: BookPageType
  title: string
  content: Record<string, unknown>
  rawText: string | null
  status: BookPageStatus
  createdAt: string
  updatedAt: string
}

export type BookFeedItem = {
  id: string
  bookId: string
  category: string
  headline: string
  detail: Record<string, unknown>
  seenAt: string | null
  createdAt: string
}

export type BookDetail = BookSummary & {
  pages: BookPage[]
  feeds: BookFeedItem[]
}

function toJson(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function toIso(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null
}

export async function listBooks(ownerId: string): Promise<BookSummary[]> {
  const books = await prisma.marketBook.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { pages: true, feeds: true } },
    },
  })

  return books.map((b) => ({
    id: b.id,
    title: b.title,
    subject: b.subject,
    type: b.type as BookType,
    metadata: toJson(b.metadata),
    lastFedAt: toIso(b.lastFedAt),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    pageCount: b._count.pages,
    feedCount: b._count.feeds,
  }))
}

export async function getBook(id: string, ownerId: string): Promise<BookDetail | null> {
  const book = await prisma.marketBook.findFirst({
    where: { id, ownerId },
    include: {
      pages: { orderBy: { createdAt: "asc" } },
      feeds: { orderBy: { createdAt: "desc" }, take: 30 },
      _count: { select: { pages: true, feeds: true } },
    },
  })

  if (!book) return null

  return {
    id: book.id,
    title: book.title,
    subject: book.subject,
    type: book.type as BookType,
    metadata: toJson(book.metadata),
    lastFedAt: toIso(book.lastFedAt),
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
    pageCount: book._count.pages,
    feedCount: book._count.feeds,
    pages: book.pages.map((p) => ({
      id: p.id,
      bookId: p.bookId,
      type: p.type as BookPageType,
      title: p.title,
      content: (toJson(p.content) ?? {}) as Record<string, unknown>,
      rawText: p.rawText,
      status: p.status as BookPageStatus,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    feeds: book.feeds.map((f) => ({
      id: f.id,
      bookId: f.bookId,
      category: f.category,
      headline: f.headline,
      detail: (toJson(f.detail) ?? {}) as Record<string, unknown>,
      seenAt: toIso(f.seenAt),
      createdAt: f.createdAt.toISOString(),
    })),
  }
}

export async function createBook(input: {
  ownerId: string
  title: string
  subject: string
  type: BookType
  metadata?: Record<string, unknown>
}): Promise<BookSummary> {
  const book = await prisma.marketBook.create({
    data: {
      ownerId: input.ownerId,
      title: input.title,
      subject: input.subject,
      type: input.type,
      metadata: (input.metadata ?? {}) as object,
    },
    include: { _count: { select: { pages: true, feeds: true } } },
  })

  return {
    id: book.id,
    title: book.title,
    subject: book.subject,
    type: book.type as BookType,
    metadata: toJson(book.metadata),
    lastFedAt: null,
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
    pageCount: 0,
    feedCount: 0,
  }
}

export async function deleteBook(id: string, ownerId: string): Promise<boolean> {
  const result = await prisma.marketBook.deleteMany({ where: { id, ownerId } })
  return result.count > 0
}

export async function upsertBookPage(input: {
  bookId: string
  type: BookPageType
  title: string
  content: Record<string, unknown>
  rawText?: string
  status: BookPageStatus
}): Promise<BookPage> {
  const existing = await prisma.bookPage.findFirst({
    where: { bookId: input.bookId, type: input.type },
  })

  const data = {
    title: input.title,
    content: input.content as object,
    rawText: input.rawText ?? null,
    status: input.status,
  }

  const page = existing
    ? await prisma.bookPage.update({ where: { id: existing.id }, data })
    : await prisma.bookPage.create({
        data: { bookId: input.bookId, type: input.type, ...data },
      })

  return {
    id: page.id,
    bookId: page.bookId,
    type: page.type as BookPageType,
    title: page.title,
    content: (toJson(page.content) ?? {}) as Record<string, unknown>,
    rawText: page.rawText,
    status: page.status as BookPageStatus,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  }
}

export async function appendFeedItem(input: {
  bookId: string
  category: string
  headline: string
  detail: Record<string, unknown>
}): Promise<BookFeedItem> {
  const item = await prisma.bookFeed.create({
    data: {
      bookId: input.bookId,
      category: input.category,
      headline: input.headline,
      detail: input.detail as object,
    },
  })

  return {
    id: item.id,
    bookId: item.bookId,
    category: item.category,
    headline: item.headline,
    detail: (toJson(item.detail) ?? {}) as Record<string, unknown>,
    seenAt: null,
    createdAt: item.createdAt.toISOString(),
  }
}

export async function markFeedSeen(bookId: string, feedIds: string[]): Promise<void> {
  await prisma.bookFeed.updateMany({
    where: { bookId, id: { in: feedIds }, seenAt: null },
    data: { seenAt: new Date() },
  })
}
