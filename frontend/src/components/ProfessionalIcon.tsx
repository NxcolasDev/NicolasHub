export default function ProfessionalIcon({ label }: { label: string }) {
  const brand = label === "GitHub" ? "github" : label === "LinkedIn" ? "linkedin" : null;
  return brand && <img className={`professional-icon ${brand}`} src={`/assets/logos/${brand}.svg`} alt="" width="16" height="16" />;
}
