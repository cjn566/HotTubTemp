<template>
  <div>
    <h1>
      <span v-if="loaded.latest">{{ latest.mixed ? "" : "~" }}{{latest.average}}</span><span v-else>--</span> °F
    </h1>
    <span v-if="loaded.latest">{{latesttime}}</span>
    <div v-if="loaded.latest" id="tempIcons">
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

    <div v-if="prediction.isCold && prediction.canPredict">
      ETA: {{ prediction.minutes }} minutes
    </div>
    <div>
      <scatter-chart
        :chart-options="chartOptions"
        :chart-data="chartData"
      />
      <button @click="changeTimeScale()">Change time scale</button
      >{{ minutesSet[minutesIdx] }}
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
import regression from "regression"

function convertRecord(record) {
  record.date = new Date(record.created_at.replace(" ", "T"))
  delete record.created_at

  record.average = +((record.upper + record.lower) / 2).toFixed(1)
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
      loaded: {
        latest: false,
      },
      minutesIdx: 0,
      minutesSet: [30, 120, 360, 720],
      prediction: {
        minDataPoints: 11,
        valid: false,
        isCold: true,
        canPredict: false,
        minutes: 0,
        m: 0,
        b: 0,
      },
      target: 106,
      tolerance: 2,
      updateTimer: {},
    }
  },
  computed: {
    latest() {
      return this.allRecords[0]
    },
    latesttime() {
      return this.latest.date.toLocaleTimeString("en-US", {
        timeStyle: "short",

      })
    },
    chartData() {
      var subrecords = this.allRecords.slice(
        0,
        this.minutesSet[this.minutesIdx]
      )
      return {
        datasets: [
          {
            // Upper Probe
            data: subrecords
              .filter((r) => !r.mixed)
              .map((r) => {
                return {
                  x: r.date,
                  y: r.upper,
                }
              }),
            backgroundColor: "red",
          },
          {
            // Lower Probe
            data: subrecords
              .filter((r) => !r.mixed)
              .map((r) => {
                return {
                  x: r.date,
                  y: r.lower,
                }
              }),
            backgroundColor: "blue",
          },
          {
            // Homogenous readings
            data: subrecords
              .filter((r) => r.mixed)
              .map((r) => {
                return {
                  x: r.date,
                  y: r.average,
                }
              }),
            backgroundColor: "green",
          },
          {
            data: this.prediction.forecast,
            backgroundColor: "purple",
          },
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
    this.getLastTemp()
    this.getTemps()

    this.updateTimer = setInterval(this.getLastTemp, 60 * 1000)

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
      this.allRecords = res.data
      this.allRecords = this.allRecords.map(convertRecord)
      //this.getLinReg()
    },
    async getLastTemp() {
      const url = "/api/app/getLastTemp/"
      const res = await this.$axios.get(url)
      let lastTemp = res.data[0]

      if (lastTemp.id > (this.allRecords[0]?.id || 0)) {
        lastTemp = convertRecord(lastTemp)
        this.allRecords.unshift(lastTemp)
        this.loaded.latest = true
      }

      // this.getLinReg()
    },
    getLinReg() {
      this.prediction.valid = false
      this.prediction.fit = "none"
      if (this.allRecords.length >= this.prediction.minDataPoints) {
        var f = [],
          now = Date.now()
        const data = this.allRecords
          .slice(0, this.prediction.minDataPoints)
          .map((r) => {
            return [-(now - r.date) / 60000, r.average]
          })
        // console.log(data)
        const result = regression.polynomial(data, { order: 2, precision: 3 })
        this.prediction.regression = result

        for (var x = 0; x < 10; x++) {
          f.push({ x: new Date(now + x * 60000), y: result.predict(x)[1] })
        }
        this.prediction.forecast = f

        var diff = this.target - this.latest.average
        this.prediction.isCold = diff > 0

        if (this.prediction.isCold) {
          if (result.equation[0] == 0) {
            // fit is linear
            this.prediction.fit = "linear"
            this.prediction.minutes =
              (this.target - result.equation[2]) / result.equation[1]
            if (this.prediction.minutes > 0 && this.prediction.minutes < 60) {
              this.prediction.valid = true
            }
          } else {
            // Fit is quadratic
            this.prediction.fit = "quadratic"
            const a = result.equation[0]
            const b = result.equation[1]
            const c = result.equation[2] - this.target
            const D = Math.sqrt(Math.pow(b, 2) - 4 * a * c)
            var sol1 = (-b + D) / (2 * a)
            var sol2 = (-b - D) / (2 * a)

            this.prediction.sol1 = sol1
            this.prediction.sol2 = sol2

            this.prediction.minutes = sol1
            if (sol1 > 0) {
              if (sol2 > 0) {
                if (sol1 - sol2 > 0) {
                  this.prediction.minutes = sol2
                  this.prediction.valid = true
                } else {
                  this.prediction.valid = true
                }
              } else {
                this.prediction.valid = true
              }
            } else {
              if (sol2 > 0) {
                this.prediction.minutes = sol2
                this.prediction.valid = true
              }
            }
          }
        }
      }
    },
    changeTarget(inc) {
      this.target += +inc
      localStorage.setItem("targetTemp", this.target)
    },
    changeTimeScale() {
      this.minutesIdx = (this.minutesIdx + 1) % this.minutesSet.length
    },
  },
}
</script>
