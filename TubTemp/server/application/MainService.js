
export default class MainService {
  constructor (mainRepo, logger) {
    this.mainRepo = mainRepo
    this.logger = logger
  }

  async recordTemp (temps) {
    await this.mainRepo.recordTemps(temps)
  }

  async getTemps () {
    return await this.mainRepo.getTemps(200)
  }

  async getLastTemp () {
    return await this.mainRepo.getTemps(1)
  }




  async getAllListsForUser (userId) {
    let lists = await this.mainRepo.getAllListsForUser(userId)
    lists = this.stripUserID(lists)

    lists = lists.reduce((obj, list) => {
      obj[list.id] = list
      return obj
    }, {})

    return lists
  }

  async getChildrenRecursively (id, items) {
    const children = await this.mainRepo.getChildren(id)
    for (const child of children) {
      child.children = await this.getChildrenRecursively(child.id, items)
      items.set(child.id, child)
    }
    return children.sort((a, b) => {
      return a.idx - b.idx
    }).map(c => c.id)
  }

  async getAllItemsForList (listId) {
    let res = await this.mainRepo.getAllItemsForList(listId)

    // convert array to object, stripping username and adding children
    res = res.reduce((obj, item) => {
      delete item.user_id
      item.children = []
      obj[item.id] = item
      return obj
    }, {})

    return res
  }

  async newItem (item, user) {
    const result = await this.mainRepo.newItem(item.parent, item.name, item.idx, item.listId)
    return result
  }

  async updateItem (payload) {
    await Object.keys(payload.updates).forEach(async (key) => {
      await this.mainRepo.updateItem(payload.id, key, payload.updates[key])
    })
    return true
  }

  async updateList (payload) {
    await Object.keys(payload.updates).forEach(async (key) => {
      await this.mainRepo.updateList(payload.id, key, payload.updates[key])
    })
    return true
  }

  async deleteItem (id) {
    await this.mainRepo.deleteItem(id)
    return true
  }
}
