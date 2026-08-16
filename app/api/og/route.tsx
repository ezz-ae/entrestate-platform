import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get("title") || "Entrestate"
  const description = searchParams.get("description") || "Market intelligence for real estate teams."

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b1118",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(47,90,166,0.35) 0%, transparent 45%), radial-gradient(circle at 80% 40%, rgba(148,163,184,0.25) 0%, transparent 50%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
            color: "white",
            fontWeight: 700,
            fontSize: 46,
            letterSpacing: "-0.02em",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 6,
              marginRight: 16,
            }}
          >
            <div style={{ width: 18, height: 18, borderRadius: 6, background: "#e2e8f0" }} />
            <div style={{ width: 18, height: 18, borderRadius: 6, background: "#94a3b8" }} />
            <div style={{ width: 18, height: 18, borderRadius: 6, background: "#2f5aa6" }} />
          </div>
          ENTRESTATE
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: 920,
            textAlign: "center",
            padding: "0 72px",
          }}
        >
          <h1
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "white",
              lineHeight: 1.15,
              marginBottom: 18,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 28,
              color: "#cbd5e1",
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
