<script src="https://unpkg.com/svelte-heatmap">
  import { Octokit } from "octokit";
  import { tweened } from "svelte/motion";
  import Pie from "./Pie.svelte";

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
    const runlist = await run();
    let size = runlist.data["workflow_runs"].length;
    let pass = 0;
    let fail = 0;
    for (let i = 0; i < size; i++) {
      if (runlist.data["workflow_runs"][i]["conclusion"] == "failure") {
        fail += 1;
      } else {
        pass += 1;
      }
    }
    return fail;
  }

  let result = 0;
  const store = tweened(0, { duration: 1000 });
  (async () => {
    let result = await run_details();
    console.log(result);
    store.set(result);
  })();
</script>

<body>
  <Pie size={200} percent={$store} />
</body>

<style>
  body {
    background-color: #17223b;
  }
</style>
