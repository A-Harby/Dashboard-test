<script>
  export let size = 200;
  export let percent = 0;
  export let bgColor = "#1e7145";
  export let fgColor = "#b91d47";
  $: viewBox = `0 0 ${size} ${size}`;

  $: radius = size / 2;
  $: halfCircumference = Math.PI * radius;
  $: pieSize = halfCircumference * (percent / 100);
  $: dashArray = `0 ${halfCircumference - pieSize} ${pieSize}`;
</script>

<svg width={size} height={size} {viewBox}>
  <circle r={radius} cx={radius} cy={radius} fill={bgColor} />
  <circle
    r={radius / 2}
    cx={radius}
    cy={radius}
    fill={bgColor}
    stroke={fgColor}
    stroke-width={radius}
    stroke-dasharray={dashArray}
  />
</svg>
