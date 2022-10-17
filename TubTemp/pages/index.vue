<template>
  <b-container>
    <div v-if="tempsLoaded">
      <div v-if="allRecords.length > 0">
        <b-row>
          <b-col>
            <h1>{{ latest.average }}°F</h1>
            <div v-if="latest.minutesAgo < -2">
              <p v-if="latest.minutesAgo < -20">
                As of {{ -latest.minutesAgo }} minutes ago!
              </p>
              <p v-else>As of {{ -latest.minutesAgo }} minutes ago!</p>
            </div>
          </b-col>
          <b-col>
            <button @click="target++">
              up
            </button>
            {{target}}
            <button @click="target--">
              down
            </button>
          </b-col>
        </b-row>

        <div v-if="prediction.isCold && prediction.canPredict">
          ETA: {{ prediction.minutes }} minutes
        </div>
        <div>
          <scatter-chart
            :v-if="tempsLoaded"
            :chart-options="chartOptions"
            :chart-data="chartData"
          />
          <button @click="changeTimeScale()">Change time scale</button
          >{{ minutesSet[minutesIdx] }}
        </div>
      </div>
      <div v-else>No temperature data!</div>
    </div>
    <div v-else>Loading...</div>
  </b-container>
</template>

<script>
import { Scatter as ScatterChart } from "vue-chartjs";
import annotationPlugin from "chartjs-plugin-annotation";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
} from "chart.js";
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
  annotationPlugin
);
import linReg from "~/utils/LinearRegression";

function convertRecord(record) {
  record.date = new Date(record.created_at.replace(" ", "T"));
  delete record.created_at;

  record.average = ((record.upper + record.lower) / 2).toFixed(1);
  record.mixed = Math.abs(record.upper - record.lower) < 1;
  return record;
}

export default {
  components: {
    ScatterChart,
  },
  data() {
    return {
      allRecords: [],
      tempsLoaded: false,
      minutesIdx: 0,
      minutesSet: [30, 120, 360, 720],
      prediction: {
        isCold: true,
        canPredict: false,
        minutes: 0,
        m: 0,
        b: 0,
      },
      target: 106,
      updateTimer: {},
    };
  },
  computed: {
    latest() {
      return this.allRecords[0];
    },
    chartData() {
      var subrecords = this.allRecords.slice(
        0,
        this.minutesSet[this.minutesIdx]
      );
      return {
        datasets: [
          {
            data: subrecords
              .filter((r) => !r.mixed)
              .map((r) => {
                return {
                  x: r.minutesAgo,
                  y: r.upper,
                };
              }),
          },
          {
            data: subrecords
              .filter((r) => !r.mixed)
              .map((r) => {
                return {
                  x: r.minutesAgo,
                  y: r.lower,
                };
              }),
          },
          {
            data: subrecords
              .filter((r) => r.mixed)
              .map((r) => {
                return {
                  x: r.minutesAgo,
                  y: r.average,
                };
              }),
          },
        ],
      };
    },
    chartOptions() {
      return {
        responsive: true,
        showLine: false,
        scales: {
          x: {
            title: {
              display: true,
              text: "Minutes",
            },
            min: -this.minutesSet[this.minutesIdx],
            max: 10,
          },
          y: {
            title: {
              display: true,
              text: "°F",
            },
            //min: 60,
            max: 115,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          autocolors: false,
          annotation: {
            annotations: {
              targetTemp: {
                type: "line",
                yMin: this.target,
                yMax: this.target,
                borderColor: "rgb(255, 99, 132)",
                borderWidth: 1,
              },
              prediction: {
                type: "line",
                yMin: this.prediction.b,
                xMin: 0,
                yMax: this.prediction.m * 10 + this.prediction.b,
                xMax: 10,
              },
            },
          },
        },
      };
    },
  },
  mounted() {
    this.getTemps();
    this.updateTimer = setInterval(this.getLastTemp, 60 * 1000);
  },
  methods: {
    async getTemps() {
      const url = "/api/app/getTemps/";
      const res = await this.$axios.get(url);
      this.tempsLoaded = true;
      this.allRecords = res.data;
      this.allRecords = this.allRecords.map(convertRecord);
      this.setMinutesAgo();
      this.getLinReg();
    },
    async getLastTemp() {
      const url = "/api/app/getLastTemp/";
      const res = await this.$axios.get(url);
      let lastTemp = res.data[0];

      if (lastTemp.id > (this.allRecords[0]?.id || 0)) {
        lastTemp = convertRecord(lastTemp);
        this.allRecords.unshift(lastTemp);
      }
      this.setMinutesAgo();
      this.getLinReg();
    },
    setMinutesAgo() {
      let now = Date.now();
      this.allRecords.forEach((r) => {
        r.minutesAgo = r.minutesAgo = -Math.floor((now - r.date) / (1000 * 60));
      });
    },
    getLinReg() {
      this.prediction = linReg(
        this.allRecords.slice(0, 20).map((r) => {
          return { x: r.minutesAgo, y: r.average };
        })
      );
      var diff = this.target - this.latest.average;
      this.prediction.isCold = diff > 0;
      this.prediction.canPredict = diff > 0 && this.prediction.m > 0.1;
      this.prediction.minutes = this.prediction.canPredict
        ? diff / this.prediction.m
        : null;
    },
    changeTimeScale() {
      this.minutesIdx = (this.minutesIdx + 1) % this.minutesSet.length;
    },
  },
};
</script>
