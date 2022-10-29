/**
 *
 * @param env
 * @param cb
 */
function init (env, cb) {
  // detect what storage driver loader class to get
  let [driverName, packageName] = process.env.STORAGE_CLASS.split('@')
  if (packageName === undefined) {
    packageName = driverName
    driverName = 'default'
  }

  // get the storage driver loader class
  // eslint-disable-next-line security/detect-non-literal-require
  const module = require(packageName)
  const DriverClass = module[driverName]

  // pass configuration to storage driver loader, so it can decide what it needs based on the config
  const driver = new DriverClass(env)

  const callback = (err, res) => {
    console.info(`custom storage driver '${DriverClass.name}' from '${packageName}' was loaded`)
    cb(err, res)
  }

  // load the storage driver
  if (driver.needsFallback) {
    // the driver needs original MongoDB driver
    require('./mongo-storage')(env, function ready (err, store) {
      if (err) {
        return cb(err, store)
      }

      // pass the MongoDB storage to be used by the driver
      driver.setFallback(store)
      // load the driver
      driver.init(callback)
    })
  } else {
    // we don't need anything special, let's the driver load
    driver.init(callback)
  }
}

module.exports = init
