export default function DiseaseCard({ title, icon, description }) {
  return (
    <div className="premium-card p-5 hover:-translate-y-1.5 hover:shadow-[0_26px_70px_-40px_rgba(15,23,42,0.4)]">
      <div className="mb-4 text-3xl">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
