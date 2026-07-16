import { Link } from "@/i18n/navigation";

export default function NotFoundContent({
  eyebrow,
  title,
  subtitle,
  cta,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pt-16 sm:px-12">
      <div className="mx-auto max-w-xl py-24 text-center">
        <p className="font-heading text-7xl font-light text-gold-dim sm:text-8xl">{eyebrow}</p>
        <div className="mx-auto mt-6 h-px w-12 bg-gold" />
        <h1 className="mt-6 font-heading text-3xl font-light tracking-wide text-cream sm:text-4xl">
          {title}
        </h1>
        <p className="mx-auto mt-6 max-w-md text-[13px] leading-relaxed text-muted">{subtitle}</p>
        <Link
          href="/"
          className="mt-10 inline-block border border-gold px-9 py-[13px] text-[10px] font-normal tracking-[0.22em] text-gold uppercase transition-colors hover:bg-gold hover:text-midnight"
        >
          {cta}
        </Link>
      </div>
    </main>
  );
}
