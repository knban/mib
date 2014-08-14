var router = require('express').Router()
require('./session')(router)
require('./users')(router)
require('./boards')(router)
require('./columns')(router)
module.exports = router
