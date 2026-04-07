export default function DiseaseCard({ title, icon, description }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md">
      <div className="mb-4 text-3xl">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
