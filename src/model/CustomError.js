export class SpawnFailedError extends Error {
  constructor(msg) {
    super()
    this.message = msg;
    this.name = "C_SPAWN_FAILED"
  }
}

export class KillFailedError extends Error {
  constructor(msg) {
    super()
    this.message = msg;
    this.name = "C_KILL_FAILED"
  }
}

export class ConfigError extends Error {
  constructor(msg) {
    super()
    this.message = msg;
    this.name = "C_CONFIG_ERROR"
  }
}

export class UnhandledError extends Error {
  constructor(moduleName, err) {
    super()
    this.message = `Unhandled error occurs at "${moduleName}". Origin message is: \n${err.message ? err.message : err}`
    this.name = "C_UNHANDLED_ERROR"
  }
}