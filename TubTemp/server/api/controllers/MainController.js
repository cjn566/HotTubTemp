import { Router } from 'express'

export default function mainRoutes (mainService) {
  const router = new Router()
  const controller = new MainController(mainService)
  router.get('/temp', async (req, res) => await controller.recordTemp(req, res))
  router.get('/getTemps', async (req, res) => await controller.getTemps(req, res))
  router.get('/getLastTemp', async (req, res) => await controller.getLastTemp(req, res))
  return router
}

class MainController {
  constructor (mainService) {
    this.mainService = mainService
  }

  async recordTemp(req, res) {
    console.log(req.query)
    console.log(new Date().toLocaleTimeString())
    await this.mainService.recordTemp(req.query)

    console.log("\n")
    return res.status(200).send()
  }

  async getTemps(req, res) {
    let temps = await this.mainService.getTemps()
    return res.status(200).json(temps)
  }

  async getLastTemp(req, res) {

    console.log("getting last temp - " + req.ip)
    let temp = await this.mainService.getLastTemp()
    return res.status(200).json(temp)
  }











  async newListForUser (req, res) {
    await this.doStuff(res, async () => {
      return await this.mainService.newListForUser(req.user.id)
    })
  }

  async getAllItemsForList (req, res) {
    await this.doStuff(res, async () => {
      return await this.mainService.getAllItemsForList(req.params.id)
    })
  }

  async newItem (req, res) {
    await this.doStuff(res, async () => {
      return await this.mainService.newItem(req.body)
    })
  }

  async updateItem (req, res) {
    await this.doStuff(res, async () => {
      return await this.mainService.updateItem(req.body)
    })
  }

  async updateList (req, res) {
    await this.doStuff(res, async () => {
      return await this.mainService.updateList(req.body)
    })
  }

  async deleteItem (req, res) {
    await this.doStuff(res, async () => {
      return await this.mainService.deleteItem(req.params.id)
    })
  }
}
