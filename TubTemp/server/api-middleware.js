import bodyParser from 'body-parser'
import express from 'express'
import tubtempPool from './database/tubtempPool'

require('dotenv').config()

const path = '/api'
const app = express()
app.use(bodyParser.json())

import ApplicationRegistry from './ApplicationRegistry'

import mainRoutes from './api/controllers/MainController'

const registry = new ApplicationRegistry(tubtempPool)
  app.use('/app', mainRoutes(registry.createMainService()))

process.on('exit', () => tubtempPool.end())

module.exports = {
  path,
  handler: app
}
