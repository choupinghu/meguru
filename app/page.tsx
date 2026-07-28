import { db } from "@/db";
import { charms } from "@/db/schema";

// This page queries Neon via Drizzle at request time. Force dynamic
// rendering so `next build` never tries to connect to the database.
export const dynamic = "force-dynamic";

export default async function Home() {
  const rows = await db.select().from(charms);

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Meguru — DB wiring proof</h1>
      <p>{rows.length} charms in the database.</p>
      <ul>
        {rows.map((c) => (
          <li key={c.id}>
            {c.name}
            {" — "}
            {c.isCollab ? c.brand : `prefecture ${c.prefectureCode}`}
          </li>
        ))}
      </ul>
    </main>
  );
}
