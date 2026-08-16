import { getRequestContext } from "@/automation-builder/lib/request-context"
import { getRun } from "@/automation-builder/lib/store"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { teamId } = getRequestContext(request)
  const run = getRun(teamId, params.id)

  if (!run) {
    return new Response("Run not found", { status: 404 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`))
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      send("run.start", { id: run.id, status: run.status })
      await new Promise((resolve) => setTimeout(resolve, 200))
      send("run.message", { type: "summary", payload: run.output?.summary })
      await new Promise((resolve) => setTimeout(resolve, 200))
      send("run.message", { type: "outputs", payload: run.output?.outputs })
      await new Promise((resolve) => setTimeout(resolve, 200))
      send("run.complete", { id: run.id, status: run.status })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
