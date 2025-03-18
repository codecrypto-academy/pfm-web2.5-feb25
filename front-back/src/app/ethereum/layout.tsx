import EthereumHeader from "@/components/EthereumHeader";
import { GlobalProvider } from "@/context/GlobalContext";

export default function EthereumLayout({ children }: { children: React.ReactNode }) {
  return (
    <GlobalProvider>
    <div>
      <EthereumHeader /> 
      <main className="p-4">{children}</main>
    </div>
    </GlobalProvider>
  );
}
