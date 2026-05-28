import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type Todo = {
  id: string | number;
  name: string;
};

export default async function Home() {
  const supabase = await createClient();
  const { data: todos, error } = await supabase.from("todos").select("id, name");

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Supabase
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Backend integration smoke test
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          This page reads from the <code>todos</code> table using the server-side
          Supabase client.
        </p>

        {error ? (
          <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            Supabase query failed: {error.message}
          </p>
        ) : (
          <ul className="mt-8 space-y-3">
            {(todos as Todo[] | null)?.map((todo) => (
              <li
                key={todo.id}
                className="rounded-2xl border border-zinc-200 px-4 py-3 text-zinc-800 dark:border-zinc-800 dark:text-zinc-200"
              >
                {todo.name}
              </li>
            ))}
            {todos?.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-zinc-300 px-4 py-3 text-zinc-500 dark:border-zinc-700">
                No todos found.
              </li>
            ) : null}
          </ul>
        )}
      </main>
    </div>
  );
}
