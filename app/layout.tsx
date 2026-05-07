import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Inspection App",
  description: "Inspection tracking system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-200 text-black">

        {/* NAV BAR */}
        <div className="flex gap-2 p-3 bg-white border-b shadow">
          
          <Link
            href="/dashboard"
            className="p-2 bg-blue-600 text-white rounded text-center w-full"
          >
            Dashboard
          </Link>

          <Link
            href="/new"
            className="p-2 bg-gray-300 text-black rounded text-center w-full"
          >
            New
          </Link>

          <Link
            href="/calendar"
            className="p-2 bg-gray-300 text-black rounded text-center w-full"
          >
            Calendar
          </Link>

        </div>

        {/* MAIN CONTENT */}
        <div className="p-4">
          {children}
        </div>

      </body>
    </html>
  );
}

