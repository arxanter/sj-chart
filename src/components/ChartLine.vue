<template>
  <div>
    <canvas id="myChart" ref="myChart"></canvas>
  </div>
</template>

<script>
  import Chart from 'chart.js';
  export default {
    name: 'Chart',
    props: ['options', 'chartData'],
    data() {
      return {
        chart: null,
      };
    },
    mounted() {
      this.chart = new Chart(this.$refs.myChart, { type: 'line', data: this.chartData, options: this.options });
      setInterval(() => {
        this.chart.update();
      }, 3000);
    },
    watch: {
      'chartData.datasets': {
        handler() {
          this.chart.update();
        },
      },
    },
  };
</script>
