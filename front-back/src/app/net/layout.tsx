import NetHeader from "@/components/NetHeader";
import { GlobalProvider } from "@/context/GlobalContext";

export default function NetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <NetHeader /> 
      <main className="p-4">{children}</main>
    </div>
  );
}
