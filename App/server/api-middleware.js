import bodyParser from 'body-parser'
import express from 'express'

require('dotenv').config()

const path = '/api'
const app = express()
app.use(bodyParser.json())

import mainRoutes from './MainController'
app.use('/app', mainRoutes())

module.exports = {
  path,
  handler: app
}
