<script>
  import RunResult from "./RunResult.svelte";

  export let Repo1 = [];
  export let Repo2 = [];
  export let Repo3 = [];
</script>

<div class="results">
  {#each Repo1 as repo}
    <div class="repo">
      <p class="name-display">{repo.name}</p>
      <RunResult {repo} />
    </div>
  {/each}

  {#each Repo2 as repo}
    <div class="repo">
      <p class="name-display">{repo.name}</p>
      <RunResult {repo} />
    </div>
  {/each}

  {#each Repo3 as repo}
    <div class="repo">
      <p class="name-display">{repo.name}</p>
      <RunResult {repo} />
    </div>
  {/each}
</div>

<style>
  .results {
    height: 300px;
    background: #17223b;
  }
  .name-display {
    position: absolute;
    margin-top: 7px;
    margin-left: 100px;
    top: -5px;
    width: 150px;
    height: 50px;
    color: oldlace;
    text-align: center;
    font-size: xx-large;
  }
  .repo {
    padding: 91.3px;
    position: relative;
    align-items: center;
    display: table-cell;
  }
</style>
