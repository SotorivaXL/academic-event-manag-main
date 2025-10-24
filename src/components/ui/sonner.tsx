import { useTheme } from "next-themes"
import { CSSProperties } from "react"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      richColors={true}
      className="toaster group"
      style={
        {
          // Use app theme variables as defaults for Sonner's css variables
          "--normal-bg": "var(--color-bg-inset)",
          "--normal-text": "var(--color-fg)",
          "--normal-border": "transparent",

          // success/error/info can be overridden in CSS for richer visuals
          "--success-bg": "var(--green-3)",
          "--success-border": "var(--green-6)",
          "--success-text": "var(--green-11)",
          "--error-bg": "var(--red-3)",
          "--error-border": "var(--red-6)",
          "--error-text": "var(--red-11)",
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
