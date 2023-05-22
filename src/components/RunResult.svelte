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

    return await run_list(owner, repo_name, workflow_id);
  }

  let items = "Loading";
  let color = "darkgoldenrod";
  (async () => {
    const runlist = await run();
    console.log(runlist);
    items = runlist.data["workflow_runs"][0]["conclusion"];
    color = items === "success" ? "#31A82D" : "#DB3334";
    items = items === null ? "Working" : items;
    color = items === "Working" ? "darkgoldenrod" : color;
  })();
</script>

<Card>
  <h3 class="card" style="border:15px solid {color};">{items}</h3>
</Card>

<style>
  .card {
    font-size: x-large;
    padding-top: 45px;
    text-align: center;
    height: 150px;
    width: 150px;
    border-radius: 50%;
    -moz-border-radius: 50%;
    -webkit-border-radius: 50%;
  }
</style>
