import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-[5%] h-full flex flex-col flex-1">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
