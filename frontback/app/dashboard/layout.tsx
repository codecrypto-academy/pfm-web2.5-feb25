import Providers from "./providers";

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block w-full justify-center">
        <Providers>{children}</Providers>
      </div>
    </section>
  );
}
