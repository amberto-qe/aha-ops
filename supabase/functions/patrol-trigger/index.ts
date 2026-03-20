const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN") ?? "";
const GITHUB_REPO = Deno.env.get("GITHUB_REPO") ?? "ahapeter/aha-ops";
const WORKFLOW_FILE = Deno.env.get("WORKFLOW_FILE") ?? "patrol-run.yml";
const BRANCH = Deno.env.get("BRANCH") ?? "main";

async function triggerWorkflow(): Promise<{ status: number; message: string }> {
  const url =
    `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ ref: BRANCH }),
  });

  if (resp.status === 204) {
    const msg = `${new Date().toISOString()} triggered ${WORKFLOW_FILE}`;
    console.log(msg);
    return { status: 200, message: msg };
  } else {
    const body = await resp.text();
    const msg = `${new Date().toISOString()} trigger failed: ${resp.status} ${body}`;
    console.error(msg);
    return { status: resp.status, message: msg };
  }
}

Deno.serve(async (req) => {
  const token = req.headers.get("x-cron-secret");
  if (!CRON_SECRET || token !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await triggerWorkflow();
  return new Response(JSON.stringify(result), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
});
