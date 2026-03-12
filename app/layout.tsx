import type { Metadata } from "next";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CNPJHub — Consulta de CNPJs",
    template: "%s | CNPJHub",
  },
  description: "Consulte CNPJs brasileiros com visualização da teia de relacionamentos entre sócios e empresas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <body>
          <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
              <Link href="/" className="font-bold text-lg tracking-tight text-white hover:text-brand-500 transition-colors">
                CNPJ<span className="text-brand-500">Hub</span>
              </Link>

              <nav className="flex items-center gap-6">
                <Link href="/planos" className="text-sm text-zinc-400 hover:text-white transition-colors">
                  Planos
                </Link>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="btn-primary text-sm">Entrar</button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
                    Dashboard
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </nav>
            </div>
          </header>

          <main>{children}</main>

          <footer className="border-t border-zinc-800 mt-20 py-8 text-center text-sm text-zinc-600">
            © {new Date().getFullYear()} CNPJHub — Dados via BrasilAPI
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
