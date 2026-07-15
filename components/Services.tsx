import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import SectionHeading from "./SectionHeading";

export default function Services() {
  const t = useTranslations("services");

  const cards = [
    {
      key: "cargo",
      num: "01",
      title: t("cargo.title"),
      description: t("cargo.description"),
      points: [t("cargo.point1"), t("cargo.point2"), t("cargo.point3")],
      cta: t("cargo.cta"),
      href: "/contact",
    },
    {
      key: "sourcing",
      num: "02",
      title: t("sourcing.title"),
      description: t("sourcing.description"),
      points: [t("sourcing.point1"), t("sourcing.point2"), t("sourcing.point3")],
      cta: t("sourcing.cta"),
      href: "/contact",
    },
  ];

  return (
    <section id="services" className="mx-auto max-w-6xl px-6 py-24 sm:px-12">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

      <div className="mt-16 grid grid-cols-1 gap-px md:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.key}
            className="flex flex-col border border-border bg-midnight-light p-9 transition-colors hover:border-gold/30 sm:p-13"
          >
            <div className="font-heading text-5xl font-light leading-none text-gold-dim">
              {card.num}
            </div>
            <h3 className="mt-6 font-heading text-2xl font-normal tracking-wide text-cream">
              {card.title}
            </h3>
            <p className="mt-4 text-[13px] leading-loose text-muted">{card.description}</p>
            <ul className="mt-6 flex flex-col gap-2">
              {card.points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-[13px] text-muted">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href={card.href}
              className="mt-8 self-start border border-gold px-7 py-3 text-[10px] font-normal tracking-[0.22em] text-gold uppercase transition-colors hover:bg-gold hover:text-midnight"
            >
              {card.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
