# Funding
A simple tool to track the cost of things by summing their component costs.

You will need to set up a .env file with:

DATABASE_URL=postgres://<user>:<pw>@<host>:<port>/<dbname>
JWT_SECRET=<secret_token>
DEBUG_MODE=true
NUXT_HOST=localhost
NUXT_PORT=3001


You will need to run 01_setup.sql in the SqlScripts folder, and then `npm run dev` and you are good to go.
