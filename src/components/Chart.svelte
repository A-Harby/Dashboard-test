<script src="https://unpkg.com/svelte-heatmap">
  import { Octokit } from "octokit";
  import { AES } from "crypto-es/lib/aes";
  import { Utf8 } from "crypto-es/lib/core";
  import Pie from "./Pie.svelte";

  export let repo;
  let repo_name = repo.repo;
  let repo_workflow = repo.workflow;

  let data =
    "U2FsdGVkX19JiO2zWIvUIWor4+MboPmBcBMe2UqUUNG0zQ7SLX6s7L+YqXzAuzQlN6Rs370dOkyX5iP9PKU+nSaHVS5/s30i641uD4dJvKKZEsv1GHuc1/c8Qm6eTR6I9LhbOWz0m0g9mfeCqtGw7g==";
  const octokit = new Octokit({
    auth: AES.decrypt(data, "password").toString(Utf8),
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
    return [fail, pass];
  }
  async function fetchData() {
    let data = await run_details();
    console.log(data);
    return data;
  }
</script>

<body>
  {#await fetchData()}
    <p>loading</p>
  {:then result}
    <div class="chart"><Pie {result} /></div>
  {/await}

</body>

<style>
  body {
    background-color: #17223b;
  }
  .chart{
    margin-left: 75px;
    height: 275px;
    width: 275px;
    background-color: oldlace;
  }
</style>
