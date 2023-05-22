<script lang="ts">
  import FinalReport from "./components/FinalReport.svelte";
  import ReportList from "./components/ReportList.svelte";

  let Repo: any = [
    { name: "Dashboard", repo: "tfgrid_dashboard", workflow: "Selenium Tests" },
    { name: "Weblets", repo: "grid_weblets", workflow: "build" },
    { name: "TSClient", repo: "grid3_client_ts", workflow: "grid3-nightly" },
    {
      name: "Terraform",
      repo: "terraform-provider-grid",
      workflow: "Run Tests",
    },
    {
      name: "Proxy",
      repo: "tfgridclient_proxy",
      workflow: "Integration tests",
    },
  ];
</script>

<div class="nav">
  <h2>Test Dashboard</h2>
</div>
<main class="container">
  <div class="cards">
    <FinalReport {Repo} />
  </div>
  <h1 style="text-align: center;">Statistics</h1>
  <div class="cards">
    <ReportList {Repo} />
  </div>
</main>

<style>
  .nav {
    height: 75px;
    padding: 15px 0;
    font-size: x-large;
    text-align: center;
    background-color: #111217;
  }
  .cards {
    position: relative;
  }
</style>
