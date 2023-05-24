<script>
    import SuiteResult from "./SuiteResult.svelte";
  
    export let Repo4 = [];
  </script>
  
  <div class="results">
    {#each Repo4 as repo}
      <div class="repo">
        <p class="name-display">{repo.name}</p>
        <p class="name-display date">{repo.Created}</p>
        <div class="chart"> <SuiteResult {repo} /> </div>
      </div>
    {/each}
  </div>
  
  <style>
    .results{
      height: 450px;
      padding-left: 30px;
      background: #17223b;
    }
    .name-display {
      position: absolute;
      margin-top: 10px;
      margin-left: 25px;
      top: -5px;
      width: 275px;
      color: oldlace;
      text-align: center;
      font-size: xx-large;
    }
    .date{
      margin-top: 90px;
    }
    .repo {
      padding: 10px;
      padding-left: 25px;
      position: relative;
      align-items: center;
      display: table-cell;
    }
    .chart{
      background: oldlace;
      margin-top: 125px;
      margin-left: 10px;
    }
  </style>
  