import { Router } from 'express'

export default function mainRoutes () {
  const router = new Router()

  const numTemps = 30
  const temps = []

  router.get('/temp', async (req, res) => {
    console.log(req.query)
    console.log(new Date().toLocaleTimeString())
    temps.push({
      upper: req.query.upper,
      lower: req.query.lower,
      ts: Date.now()
    })

    if(temps.length > numTemps) temps.shift()

    return res.status(200).send()
  })

  router.get('/getTemps', async (req, res) => {
    return res.status(200).json(temps)
  })

  return router
}
