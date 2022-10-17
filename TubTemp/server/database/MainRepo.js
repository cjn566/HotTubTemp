
import BaseRepo from './BaseRepo'

export default class ReportRepo extends BaseRepo {

  async recordTemps (temps) {
    const params = [temps.upper, temps.lower]
    await this.withClient(client => client.query(
      'insert into hottub.temps (upper, lower) values ($1, $2)', params))
  }

  async getTemps (count) {
    const results = await this.withClient(client => client.query(
      `select * from hottub.temps order by created_at desc limit ${count}`))
    return results.rows
  }





  async updateItem (id, key, value) {
    const params = [value, id]
    const query = `update app.cost_node set ${key} = $1 where id = $2`
    try {
      await this.withClient(client => client.query(query, params))
    }
    catch (err) {
      console.log(err.message)
    }
  }

  async updateList (id, key, value) {
    const params = [value, id]
    const query = `update app.list set ${key} = $1 where id = $2`
    try {
      await this.withClient(client => client.query(query, params))
    }
    catch (err) {
      console.log(err.message)
    }
  }

  async newListForUser (userId, listName) {
    const params = [userId, listName]
    const results = await this.withClient(client => client.query(
      'insert into app.list (user_id, name) values ($1, $2) returning *', params))
    const newlist = results.rows[0]
    return newlist
  }

  async getAllListsForUser (userId) {
    const params = [userId]
    const results = await this.withClient(client => client.query(
      'select * from app.list where user_id = $1', params))
    return results.rows
  }

  async getAllItemsForList (listId) {
    const params = [listId]
    const results = await this.withClient(client => client.query(
      'select * from app.cost_node where list_id = $1', params))
    return results.rows
  }
  async deleteItem (id) {
    const params = [id]
    const query = 'delete from app.cost_node where id = $1'
    try {
      await this.withClient(client => client.query(query, params))
    }
    catch (err) {
      console.log(err.message)
    }
  }
}
