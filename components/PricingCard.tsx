import Link from "next/link";

type Plan = {
  name: string;
  nameEn: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
};

export default function PricingCard({ plan }: { plan: Plan }) {
  return (
    <div className={`relative rounded-2xl p-8 flex flex-col border-2 transition hover:-translate-y-1 hover:shadow-xl
      ${plan.highlighted
        ? "border-blue-600 bg-gradient-to-b from-blue-600 to-violet-700 text-white shadow-2xl scale-105"
        : "border-gray-200 bg-white text-gray-900"}`}>

      {plan.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-gray-900 text-xs font-black px-4 py-1 rounded-full">
          {plan.badge}
        </div>
      )}

      <div className="mb-6">
        <h3 className={`text-xl font-black mb-1 ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
          {plan.name}
        </h3>
        <p className={`text-xs ${plan.highlighted ? "text-blue-200" : "text-gray-500"}`}>{plan.nameEn}</p>
      </div>

      <div className="mb-6">
        <span className={`text-5xl font-black ${plan.highlighted ? "text-white" : "gradient-text"}`}>
          {plan.price}
        </span>
        {plan.price !== "تواصل" && (
          <span className={`text-sm mr-1 ${plan.highlighted ? "text-blue-200" : "text-gray-500"}`}>
            /{plan.period}
          </span>
        )}
        <p className={`text-sm mt-2 ${plan.highlighted ? "text-blue-100" : "text-gray-600"}`}>{plan.desc}</p>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map(f => (
          <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlighted ? "text-blue-100" : "text-gray-700"}`}>
            <svg className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? "text-green-300" : "text-green-500"}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <Link href="/auth" className={`text-center font-bold py-3 rounded-xl transition text-sm
        ${plan.highlighted
          ? "bg-white text-blue-700 hover:bg-blue-50"
          : "gradient-bg text-white hover:opacity-90"}`}>
        {plan.cta}
      </Link>
    </div>
  );
}
