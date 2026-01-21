import type { Metadata } from 'next';
import './globals.css'; // WICHTIG: Hier laden wir das CSS für den Hintergrund

export const metadata: Metadata = {
    title: 'Smart Display Prototype',
    description: 'Next.js Smart Display UI',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="de">
        <body>{children}</body>
        </html>
    );
}