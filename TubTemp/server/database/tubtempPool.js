import { Pool } from 'pg'
import { parse } from 'pg-connection-string'

require('dotenv').config()

const config = parse(process.env.DATABASE_URL)
config.ssl = false // process.env.PG_SSL !== undefined ? process.env.PG_SSL !== 'false' : true
config.connectionTimeoutMillis = parseInt(process.env.PG_CONNECTION_TIMEOUT_MS || 0)

const tubtempPool = new Pool(config)

export default tubtempPool
