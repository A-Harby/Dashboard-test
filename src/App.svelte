<script lang="ts">
  import FinalReport from "./components/FinalReport.svelte";
  import ReportList from "./components/ReportList.svelte";
  import SuiteRun from "./components/SuiteRun.svelte";

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
    { name: "Mainnet Mastodon 3.9.0", Created: "8th May 2023", Pass: 50, Fail : 3, Skip: 2, Notrun: 1 },
    { name: "Mainnet 3.9.0 TestRun", Created: "4th Apr 2023", Pass: 537, Fail : 4, Skip: 6, Notrun: 13 },
    { name: "Testnet 3.9.0 TestRun", Created: "23rd Mar 2023", Pass: 531, Fail : 28, Skip: 2, Notrun: 0 },
    { name: "QAnet 3.9.0 TestRun", Created: "6th Mar 2023", Pass: 567, Fail : 13, Skip: 1, Notrun: 13},
    { name: "Mainnet 3.8 TestRun", Created: "21st Feb 2023", Pass: 400, Fail : 8, Skip: 3, Notrun: 0}
  ];

  let Repo5: any = [
    Repo1[1], Repo2[0], Repo2[1], Repo1[2], Repo1[3]
  ];

</script>

<div class="nav">
  <h2>Test Dashboard</h2>
</div>
<main class="container">
  <h1 style="text-align: center;">Daily Test Run Result</h1>
  <div class="cards">
    <FinalReport {Repo1} />
    <FinalReport {Repo2} />
    <FinalReport {Repo3} />
  </div>
  <h1 style="text-align: center;">Test Suite Run Result</h1>
  <div class="cards">
    <SuiteRun {Repo4} />
  </div>
  <h1 style="text-align: center;">Test Run Statistics</h1>
  <div class="cards">
    <ReportList {Repo5} />
  </div>
</main>

<style>
  .nav {
    height: 55px;
    padding: 8px;
    font-size: x-large;
    text-align: center;
    background-color: #111217;
  }
  .cards {
    position: relative;
  }
</style>
