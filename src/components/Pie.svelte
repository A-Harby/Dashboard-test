<script>
  import { Doughnut } from "svelte-chartjs";

  export let result;

  export const data = {
    labels: ["Failed", "Passed"],
    datasets: [
      {
        data: [result[0], result[1]],
        backgroundColor: ["#F7464A", "#8BC34A"],
        hoverBackgroundColor: ["#FF5A5E", "#9CCC4B"],
      },
    ],
  };

  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    CategoryScale,
    LinearScale,
  } from "chart.js";

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    ArcElement,
    CategoryScale,
    LinearScale
  );
</script>

<Doughnut {data} options={{ responsive: true }} />
