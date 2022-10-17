// repositories
import MainRepo from './database/MainRepo'

// Services
import MainService from './application/MainService'

export default class ApplcationRegistry {
  constructor (dbPool) {
    this.dbPool = dbPool
  }

  createMainService () {
    const mainRepo = new MainRepo(this.dbPool)
    const mainService = new MainService(mainRepo)
    return mainService
  }
}
