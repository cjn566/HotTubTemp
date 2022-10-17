
export default class BaseRepo {
  constructor (dbPool, logger) {
    this.dbPool = dbPool
    this.logger = logger
  }

  // dbOp(client: DbClient) => Promise<any>
  async withClient (dbOp) {
    let client
    try {
      client = await this.dbPool.connect()
      const result = await dbOp(client)
      return result
    }
    catch (ex) {
      this.logger.error(`Exception - ${ex.message}, stack trace - ${ex.stack}`)
      ex.logged = true
      throw ex
    }
    finally {
      if (client) {
        // if we managed to check out a client then we have to make sure
        // we release it or else it leaks.
        await client.release()
      }
    }
  }
}
