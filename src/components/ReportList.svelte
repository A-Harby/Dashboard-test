<script>
  import Chart from "./Chart.svelte";
  import RunList from "./RunList.svelte";
  import CollapsibleSection from "./CollapsibleSection.svelte";

  export let Repo1 = [];
  export let Repo2 = [];
  export let Repo3 = [];
</script>

<div>
{#each Repo1 as repo}
<section>
  <CollapsibleSection headerText={repo.name}>
    <div class="content">
      <div class="repo">
        <div class="repo">
          <RunList {repo} />
        </div>
        <div class="chart">
          <Chart {repo} />
        </div>
      </div>
    </div>
  </CollapsibleSection>
</section>
{/each}

{#each Repo2 as repo}
<section>
  <CollapsibleSection headerText={repo.name}>
    <div class="content">
      <div class="repo">
        <div class="repo">
          <RunList {repo} />
        </div>
        <div class="chart">
          <Chart {repo} />
        </div>
      </div>
    </div>
  </CollapsibleSection>
</section>
{/each}

{#each Repo3 as repo}
<section>
  <CollapsibleSection headerText={repo.name}>
    <div class="content">
      <div class="repo">
        <div class="repo">
          <RunList {repo} />
        </div>
        <div class="chart">
          <Chart {repo} />
        </div>
      </div>
    </div>
  </CollapsibleSection>
</section>
{/each}
</div>

<style>
  .chart{
    display: flex;
    margin-left: auto;
    margin-right: 100px;
  }
  .repo {
    display: flex;
    height: 300px;
    align-items: center;
  }

  section {
    background-color: #20283E;
  }

  .content {
    background-color: #17223B;
    padding: 0.5em;
  }
</style>
