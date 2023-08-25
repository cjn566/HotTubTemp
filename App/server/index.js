// import path from 'path'
import bodyParser from 'body-parser'
import express from 'express'
import consola from 'consola'

import { Nuxt, Builder } from 'nuxt'
// import nuxt from 'nuxt'

import dotenv from 'dotenv'
dotenv.config()

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

// Import and Set Nuxt.js options
import config from '../nuxt.config.js'
config.dev = process.env.NODE_ENV !== 'production'

async function start () {
  // Init Nuxt.js

  const nuxt = new Nuxt(config)
  // const nuxt = new loadNuxt(config)
  // const nuxt = new createNuxt(config)
  // const nuxt = new build(config)

  const { host, port } = nuxt.options.server

  await nuxt.ready()
  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  }

  // Give nuxt middleware to express
  app.use(nuxt.render)

  // Listen the server
  app.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}
start()
