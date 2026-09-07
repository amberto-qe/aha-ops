const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN") ?? "";
const GITHUB_REPO = Deno.env.get("GITHUB_REPO") ?? "amberto-qe/aha-ops";
const WORKFLOW_FILE = Deno.env.get("WORKFLOW_FILE") ?? "patrol-run.yml";
const BRANCH = Deno.env.get("BRANCH") ?? "main";

async function triggerWorkflow(): Promise<void> {
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
    console.log(`${new Date().toISOString()} triggered ${WORKFLOW_FILE}`);
  } else {
    const body = await resp.text();
    console.error(
      `${new Date().toISOString()} trigger failed: ${resp.status} ${body}`,
    );
  }
}

Deno.cron("patrol-run", "*/5 * * * *", triggerWorkflow);

console.log("patrol cron started");
