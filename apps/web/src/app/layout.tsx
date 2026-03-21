import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import NavbarWrapper from "@/components/NavbarWrapper";
import { GameProvider } from "@/contexts/GameContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { ConfigProvider } from "@/contexts/ConfigContext";
import { Toaster } from 'sonner';
import ReactQueryProvider from '@/providers/ReactQueryProvider';
import { SoundProvider } from "@/contexts/SoundContext";
import { UIProvider } from "@/contexts/UIContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { GlobalAudioObserver } from "@/components/multitable/GlobalAudioObserver";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const barlowCondensed = Barlow_Condensed({
  weight: ['600', '700'],
  subsets: ['latin'],
  variable: '--font-card',
});

export const metadata: Metadata = {
  title: "PokerHub – Live Tables & Tournaments",
  description: "Live Tables & Tournaments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* FontAwesome Icons (CSS version for React/Hydration compatibility) */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />

        {/* Custom CSS */}
        <style dangerouslySetInnerHTML={{
          __html: `
            ::-webkit-scrollbar {
              display: none;
            }
            body {
              font-family: 'Inter', sans-serif;
            }
            .hover-glow-yellow {
              transition: box-shadow 0.3s ease-in-out;
            }
            .hover-glow-yellow:hover {
              box-shadow: 0 0 15px 5px rgba(255, 215, 0, 0.3);
            }
            .hover-glow-green {
              transition: box-shadow 0.3s ease-in-out;
            }
            .hover-glow-green:hover {
              box-shadow: 0 0 15px 5px rgba(28, 139, 76, 0.4);
            }
            .focus-glow-yellow:focus {
              outline: none;
              box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.5);
              border-color: #FFD700;
            }
          `
        }} />
      </head>
      <body className={`bg-primary-bg text-text-primary ${inter.className} ${barlowCondensed.variable}`}>
        <ReactQueryProvider>
          <ConfigProvider>
            <AuthProvider>
              <GameProvider>
                <UIProvider>
                  <SoundProvider>
                    <NotificationProvider>
                      <SocketProvider>
                        <GlobalAudioObserver />
                        <NavbarWrapper />
                        {children}
                        <Toaster position="top-center" richColors />
                      </SocketProvider>
                    </NotificationProvider>
                  </SoundProvider>
                </UIProvider>
              </GameProvider>
            </AuthProvider>
          </ConfigProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
