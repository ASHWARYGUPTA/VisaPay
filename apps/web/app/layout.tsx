import type { Metadata } from "next";
import "../styles/globals.css";
import NavBar from "./Navbar";
export const metadata: Metadata = {
  title: "VisaPay",
  description: "A Freely Drawing App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="p=0 m-0 font-poppins h-screen w-full bg-linear-[-45deg] from-[#FFED48]-[28%] to-[#FFF066]-[64%] to-[#FFF385]">
          <NavBar />
          {children}
        </div>
      </body>
    </html>
  );
}
