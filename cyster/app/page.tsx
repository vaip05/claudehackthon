import Link from 'next/link';
import AuthCard from '@/components/AuthCard';
import PageContainer from '@/components/PageContainer';

const PILLARS = [
  {
    title: 'Track',
    href: '/track',
    body: 'Log your cycle and see your phase, your next period, and what your pattern might be telling you.',
  },
  {
    title: 'Talk',
    href: '/talk',
    body: 'Say what’s going on in your own words, and upload a report if you have one. No judgment.',
  },
  {
    title: 'Tips',
    href: '/tips',
    body: 'Eat, move and rest in a way that fits where you are in your cycle.',
  },
];

export default function HomePage() {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6 py-2 md:gap-12 md:py-6 lg:gap-16">
        {/* Phone: stacked. Desktop: pitch on the left, sign-in on the right. */}
        <div className="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-16">
          <section className="space-y-1 text-center lg:space-y-4 lg:text-left">
            <h1 className="text-xl font-semibold leading-tight md:text-4xl lg:text-5xl">
              Track it. Talk it. Tips for feeling your best.
            </h1>
            <p className="text-sm text-ink/70 md:text-lg lg:max-w-lg">
              A private space for periods, PMOS and endometriosis questions, and everyday tips for your body.
            </p>
          </section>

          <div className="mx-auto w-full max-w-lg lg:mx-0 lg:justify-self-end">
            <AuthCard />
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3 md:gap-6">
          {PILLARS.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className="rounded-3xl bg-white p-5 shadow-sm transition hover:bg-rose-soft/40 md:p-7"
            >
              <h2 className="font-semibold text-rose-deep md:text-xl">{p.title}</h2>
              <p className="mt-1 text-sm text-ink/70 md:mt-2 md:text-base">{p.body}</p>
            </Link>
          ))}
        </section>
      </div>
    </PageContainer>
  );
}
