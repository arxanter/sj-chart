<template>
  <div>
    <div class="block-container">
      <span>Адрес</span>
      <el-input v-model="selectedAddresses" style="width: 180px;" size="mini"></el-input>
      <el-button size="mini" type="success" @click="changeAddresses">Построить</el-button>
      <el-button type="danger" style="margin-left: 30px;" size="mini" @click="clearData">Очистить данные</el-button>
      <el-button size="mini">Экспорт данных</el-button>
      <el-button type="success" style="margin-left: 30px;" @click="tryConnectSocket" :disabled="isConnect" size="mini"
        >Подключится к шине</el-button
      >
    </div>
    <div class="chart-container">
      <ChartLine :chartData="chartData" :options="optionsChart" />
    </div>
  </div>
</template>

<script>
  import ChartLine from './components/ChartLine';
  import Vue from 'vue';
  const { ipcRenderer } = require('electron');
  export default {
    name: 'app',
    components: {
      ChartLine,
    },
    data() {
      return {
        selectedAddresses: '',
        data: [],
        addresses: [],
        isConnect: false,
        chartColors: [
          'rgb(255, 99, 132)',
          'rgb(75, 192, 192)',
          'rgb(255, 159, 64)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)',
          'rgb(153, 102, 255)',
          'rgb(231,233,237)',
        ],
        optionsChart: {
          scales: {
            xAxes: [
              {
                type: 'time',
                time: {
                  unit: 'second',
                },
                distribution: 'linear',
              },
            ],
          },
        },
        chartData: {
          datasets: [
            {
              label: '',
              data: [],
            },
          ],
        },
      };
    },
    mounted() {
      ipcRenderer.on('multicast:ready', (event, data) => {
        this.isConnect = true;
        this.$message({
          showClose: true,
          type: 'success',
          message: 'Подключились к сокету успешно',
        });
      });
      ipcRenderer.on('multicast:error', (event, data) => {
        this.isConnect = false;
        this.$message({
          showClose: true,
          type: 'error',
          message: 'Нет подключения к шине',
        });
      });
      ipcRenderer.on('multicast:message', this.messageEvent.bind(this));
      this.isConnect = ipcRenderer.sendSync('status:multicast')
    },
    methods: {
      setNewPoint(data, index) {
        if (this.chartData.datasets[index]) {
          this.chartData.datasets[index].data.push({
            t: data.date,
            y: +data.value,
          });
        }
      },
      changeAddresses() {
        if (this.selectedAddresses.length > 0) {
          this.addresses = this.selectedAddresses
            .split(',')
            .map(el => +el)
            .filter((el, index) => !Number.isNaN(el) && index <= 6);
        }
        this.chartData.datasets = [];
        this.addresses.forEach((address, index) => {
          const newDataset = this.getTemplateDataset();
          newDataset.label = `Адрес ${address}`;
          newDataset.address = address;
          newDataset.backgroundColor = this.chartColors[index];
          newDataset.borderColor = this.chartColors[index];
          this.data
            .filter(el => el.address === address)
            .map(el => {
              return {
                t: el.date,
                y: +el.value,
              };
            })
            .forEach(el => newDataset.data.push(el));
          this.chartData.datasets.push(newDataset);
        });
      },
      messageEvent(event, data) {
        const setData = data;
        if (setData) {
          setData.date = new Date();
          this.data.push(setData);
          const index = this.addresses.findIndex(el => el == setData.address);
          if (index !== -1) this.setNewPoint(setData, index);
        }
      },
      tryConnectSocket() {
        ipcRenderer.send('start:multicast');
      },
      clearData() {
        this.chartData.datasets.forEach(el => {
          el.data = []});
        this.data = [];
      },
      getTemplateDataset() {
        return {
          label: '',
          address: null,
          fill: false,
          lineTension: 0,
          responsive: true,
          aspectRatio: 8,
          backgroundColor: '#FFF',
          borderColor: '#FFF',
          data: [],
        };
      },
    },
  };
</script>
<style>
  .chart-container {
    margin: 20px;
    height: 80%;
    border: 1px solid black;
  }
  .el-message {
    top: 40px;
  }
</style>



