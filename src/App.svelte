<script lang="ts">
  import FinalReport from "./components/FinalReport.svelte";
  import ReportList from "./components/ReportList.svelte";

  let Repo1: any = [
    { name: "Dashboard Cypress", repo: "tfgrid-sdk-ts", workflow: "Dashboard Cypress Tests" },
    { name: "Dashboard Selenium", repo: "tfgrid-sdk-ts", workflow: "Dashboard Selenium Tests" },
    { name: "TS Grid Tests", repo: "tfgrid-sdk-ts", workflow: "Grid Client Tests" },
    { name: "TS Grid Nightly", repo: "tfgrid-sdk-ts", workflow: "Grid Client Nightly" }
  ];

  let Repo2: any = [
    { name: "Weblets Cypress", repo: "tfgrid-sdk-ts", workflow: "Weblets Cypress Tests" },
    { name: "Terraform Test", repo: "terraform-provider-grid", workflow: "Intgeration tests" },
    { name: "Gridify Tests", repo: "tfgrid-sdk-go", workflow: "gridify tests" },
    { name: "Go Grid Tests", repo: "tfgrid-sdk-go", workflow: "Grid3 Go Testing" }
  ];

  let Repo3: any = [
    { name: "Monitoring Bot Tests", repo: "tfgrid-sdk-go", workflow: "monbot test" },
    { name: "CLI Tests", repo: "tfgrid-sdk-go", workflow: "cli Testing" },
    { name: "Proxy Test", repo: "tfgrid-sdk-go", workflow: "proxy Integration tests" },
    { name: "RMB Test", repo: "tfgrid-sdk-go", workflow: "RMB lint and test" }
  ];

  let Repo4: any = [
    Repo1[1], Repo1[3], Repo2[1], Repo1[2]
  ];

</script>

<div class="nav">
  <h2>Test Dashboard</h2>
</div>
<main class="container">
  <div class="cards">
    <FinalReport {Repo1} />
    <FinalReport {Repo2} />
    <FinalReport {Repo3} />
  </div>
  <h1 style="text-align: center;">Statistics</h1>
  <div class="cards">
    <ReportList {Repo4} />
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
