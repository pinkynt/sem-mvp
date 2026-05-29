const DEMO_API_KEY_HEADER = "x-sem-demo-key";

export function authorizeDemoMutation(request: Request) {
  const expectedKey = process.env.SEM_DEMO_API_KEY;

  if (!expectedKey) {
    return Response.json(
      { error: "Missing SEM_DEMO_API_KEY environment variable" },
      { status: 503 },
    );
  }

  if (request.headers.get(DEMO_API_KEY_HEADER) !== expectedKey) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
