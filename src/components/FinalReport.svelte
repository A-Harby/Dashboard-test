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
    background: black;
    color: #fff;
    border: 10px #1F3F49 solid;
    text-align: center;
    font-size: x-large;
  }
  .repo {
    width: 2000px;
    height: 300px;
    padding: 60px;
    position: relative;
    align-items: center;
    display: table-cell;
  }
</style>
