export default function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-normal uppercase tracking-[0.32em] text-gold">{eyebrow}</p>
      <div className="mx-auto mb-5 mt-4 h-px w-12 bg-gold" />
      <h2 className="font-heading text-4xl font-light tracking-wide text-cream sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}
