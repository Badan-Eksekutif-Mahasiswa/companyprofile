import type { Person } from "@/lib/kabinet";
import { PersonCard } from "@/components/kabinet/PersonCard";

export function CoreLeaders({ people }: { people: Person[] }) {
  if (!people.length) return null;
  return (
    <section className="mx-auto max-w-wrap px-6 pb-20" aria-labelledby="core-leaders-title">
      <h2 id="core-leaders-title" className="mb-8 text-3xl font-bold">Pengurus Inti</h2>
      <ul className="flex flex-wrap justify-center gap-6">
        {people.map((person, index) => (
          <li key={`${person.jabatan}-${index}`} className="w-full min-[520px]:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
            <PersonCard p={person} />
          </li>
        ))}
      </ul>
    </section>
  );
}
