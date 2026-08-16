import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Password - Entrestate",
  description: "Reset your Entrestate account password securely.",
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
