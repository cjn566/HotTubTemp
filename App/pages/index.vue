<template>
  <div>
    <h1>
      <span v-if="haveData">{{ latest.mixed ? "" : "~" }}{{latest.average}}</span> °F
    </h1>
    <div v-if="haveData" id="tempIcons">
      <img
        v-if="latest.average < target - tolerance"
        src="~assets/icons/Ice.svg"
        height="100dp"
      />
      <img
        v-else-if="latest.average > target + tolerance"
        src="~assets/icons/Fire.svg"
        height="100dp"
      />
      <img v-else src="~assets/icons/Steam.svg" height="100dp" />
    </div>
    <button @click="changeTarget(-1)">-</button>
    <span>{{ target }}</span>
    <button @click="changeTarget(1)">+</button>

    <div>
      <scatter-chart
        :chart-options="chartOptions"
        :chart-data="chartData"
      />
    </div>
  </div>
</template>

<script>
import { Scatter as ScatterChart } from "vue-chartjs"
import annotationPlugin from "chartjs-plugin-annotation"
import "chartjs-adapter-moment"
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
  TimeScale,
} from "chart.js"
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
  annotationPlugin,
  TimeScale
)

function convertRecord(record) {
  var blorp = Number(record.upper) + Number(record.lower)
  record.average = (blorp / 2).toFixed(1)
  record.mixed = Math.abs(record.upper - record.lower) < 2
  return record
}

export default {
  components: {
    ScatterChart,
  },
  data() {
    return {
      allRecords: [],
      target: 106,
      tolerance: 2,
      updateTimer: {},
    }
  },
  computed: {
    haveData() {
      return (this.allRecords.length > 0)
    },
    latest() {
      return this.allRecords[0]
    },
    chartData() {
      return {
        datasets: [
          {
            // Upper Probe
            data: this.allRecords
              .filter((r) => !r.mixed)
              .map((r) => {
                return {
                  x: r.ts,
                  y: r.upper,
                }
              }),
            backgroundColor: "red",
          },
          {
            // Lower Probe
            data: this.allRecords
              .filter((r) => !r.mixed)
              .map((r) => {
                return {
                  x: r.ts,
                  y: r.lower,
                }
              }),
            backgroundColor: "blue",
          },
          {
            // Homogenous readings
            data: this.allRecords
              .filter((r) => r.mixed)
              .map((r) => {
                return {
                  x: r.ts,
                  y: r.average,
                }
              }),
            backgroundColor: "green",
          }
        ],
      }
    },
    chartOptions() {
      return {
        responsive: true,
        showLine: false,
        scales: {
          x: {
            type: "time",
            time: {
              unit: "minute",
            },
            ticks: {
              major: {
                enabled: true,
              },
              callback: function (value, index, ticks) {
                return value
              },
            },
          },
          y: {
            suggestedMin: 90,
            suggestedMax: 110,
            grid: {
              circular: true,
            },
            ticks: {
              size: 10,
              callback: function (value, index, ticks) {
                return value + "°"
              },
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          autocolors: true,
          annotation: {
            annotations: {
              targetTemp: {
                type: "line",
                yMin: this.target,
                yMax: this.target,
                borderColor: "rgb(255, 99, 132)",
                borderWidth: 1,
              },
            },
          },
        },
      }
    },
  },
  mounted() {
    this.getTemps()

    this.updateTimer = setInterval(this.getTemps, 60 * 1000)

    const str = localStorage.getItem("targetTemp")
    if (typeof str == "string" && !isNaN(str) && !isNaN(parseInt(str))) {
      this.target = +str
    }
  },
  methods: {
    async getTemps() {
      const url = "/api/app/getTemps/"
      const res = await this.$axios.get(url)
      this.tempsLoaded = true
      this.allRecords = res.data.map(convertRecord)
    },
    changeTarget(inc) {
      this.target += +inc
      localStorage.setItem("targetTemp", this.target)
    },
  },
}
</script>
