<script>
  import RunResult from "./RunResult.svelte";

  export let Repo = [];
</script>

<div class="repo">
  {#each Repo as repo}
    <div class="repo">
      <p class="name-display">{repo.name}</p>
      <RunResult {repo} />
    </div>
  {/each}
</div>

<style>
  .name-display {
    position: absolute;
    top: -10px;
    width: 150px;
    height: 50px;
    color: oldlace;
    text-align: center;
    font-size: xx-large;
  }
  .repo {
    height: 300px;
    padding: 91.3px;
    position: relative;
    align-items: center;
    display: table-cell;
    background: #17223b;
  }
</style>
