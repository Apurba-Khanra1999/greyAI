import type {Metadata} from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'IndigoChat',
  description: 'A minimalist conversational AI assistant.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-sans antialiased", outfit.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
