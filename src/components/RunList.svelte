<script>
  import { Octokit } from "octokit";
  import Card from "./Card.svelte";

  export let repo;
  let repo_name = repo.repo;
  let repo_workflow = repo.workflow;

  const octokit = new Octokit({
    auth: "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",
  });

  function workflow(owner, repo) {
    return (workflow = octokit.request(
      "GET /repos/{owner}/{repo}/actions/workflows",
      {
        owner: owner,
        repo: repo,
      }
    ));
  }

  function run_list(owner, repo, id) {
    return octokit.request(
      "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs",
      {
        owner: owner,
        repo: repo,
        workflow_id: id,
      }
    );
  }

  async function run() {
    let workflow_id;
    const owner = "threefoldtech";

    const workflow_ob = await workflow(owner, repo_name);

    for (let i = 0; i < workflow_ob.data["workflows"].length; i++) {
      if (workflow_ob.data["workflows"][i].name === repo_workflow) {
        workflow_id = workflow_ob.data["workflows"][i].id;
      }
    }

    const run_list_ob = await run_list(owner, repo_name, workflow_id);

    return run_list_ob;
  }

  async function run_details() {
    let runs = [];
    const runlist = await run();
    let color = "darkgoldenrod";
    let number,
      result,
      time,
      url = "Loading";
    let size =
      runlist.data["workflow_runs"].length > 5
        ? 5
        : runlist.data["workflow_runs"].length;
    for (let i = 0; i < size; i++) {
      number = runlist.data["workflow_runs"][i]["run_number"];
      result = runlist.data["workflow_runs"][i]["conclusion"];
      time = new Date(runlist.data["workflow_runs"][i]["run_started_at"]);
      url = await fetch(runlist.data["workflow_runs"][i]["jobs_url"])
        .then((response) => response.json())
        .then((json) => json["jobs"][0]["html_url"]);
      color = result === "success" ? "darkgreen" : "crimson";
      runs.push({
        number: number,
        result: result,
        time: time,
        url: url,
        color: color,
      });
    }
    return runs;
  }

  let runs = [];

  (async () => {
    runs = await run_details();
    console.log(runs);
  })();
</script>

{#each runs as detials}
  <Card>
    <div class="cards">
      <p>Run Number:{detials.number}</p>
      <p style="color:{detials.color};">{detials.result}</p>
      <p>{detials.time.toLocaleString()}</p>
      <a href={detials.url} target="_blank" rel="noreferrer">Logs</a>
    </div>
  </Card>
{/each}

<style>
  .cards {
    background-color: #20283e;
    margin: 10px;
    font-size: x-large;
    text-align: center;
    padding-top: 25px;
    height: 250px;
    width: 250px;
  }
</style>
