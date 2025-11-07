"use client"

interface GoogleButtonProps {
  onClick?: () => void
  isLoading?: boolean
  variant?: "signin" | "signup"
}

export function GoogleButton({ onClick, isLoading, variant = "signin" }: GoogleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="w-full inline-flex cursor-pointer items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-2.5 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-70 transition shadow-sm"
    >
      <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
        <svg viewBox="0 0 533.5 544.3" className="w-4 h-4" aria-hidden>
          <path fill="#4285F4" d="M533.5 278.4c0-18.2-1.5-36-4.4-53.2H272v100.7h147.2c-6.3 34-25 62.8-53.5 82v68.1h86.4c50.4-46.4 81.4-114.7 81.4-197.6z"/>
          <path fill="#34A853" d="M272 544.3c72.9 0 134.1-24.2 178.8-65.8l-86.4-68.1c-24.1 16.2-55 25.9-92.4 25.9-70.9 0-131-47.8-152.3-112.1H31.4v70.6C76 497.3 168.8 544.3 272 544.3z"/>
          <path fill="#FBBC05" d="M119.7 323.2c-7.3-21.7-11.5-44.9-11.5-68.6s4.2-46.9 11.5-68.6V115.4H31.4C11.3 160.7 0 210.8 0 254.6s11.3 93.9 31.4 139.2l88.3-70.6z"/>
          <path fill="#EA4335" d="M272 107.7c38.6 0 73.4 13.3 100.8 39.6l75.6-75.6C402 24.2 340.8 0 272 0 168.8 0 76 47 31.4 115.4l88.3 68.6C141 155.5 201.1 107.7 272 107.7z"/>
        </svg>
      </span>
      <span className="text-sm font-medium text-gray-700">
        {isLoading
          ? "Aguarde..."
          : variant === "signup"
          ? "Cadastrar com Google"
          : "Entrar com Google"}
      </span>
    </button>
  )
}