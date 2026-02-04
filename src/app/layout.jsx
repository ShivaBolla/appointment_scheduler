import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata = {
    title: "Appointment Scheduler",
    description: "Book appointments easily with our professional scheduling system",
};

export default function RootLayout({
    children,
}) {
    return (
        <html lang="en">
            <body className={`${inter.variable} font-sans antialiased`}>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
