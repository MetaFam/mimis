class Settings {
  static keys = {
    ipfsPattern: 'mimis-setting-ipfs-pattern',
  }
  static defaults = {
    [Settings.keys.ipfsPattern]: 'http://localhost:8080/ipfs/{cid}',
  }

  ipfsConversion = $state(
    typeof localStorage === 'undefined' ? (
      Settings.defaults[Settings.keys.ipfsPattern]
    ) : (
      localStorage.getItem(Settings.keys.ipfsPattern)
      ?? (() => {
        const defaultVal = Settings.defaults[
          Settings.keys.ipfsPattern
        ]
        localStorage.setItem(
          Settings.keys.ipfsPattern,
          defaultVal,
        )
        return defaultVal
      })()
    )
  )

  save(key?: string) {
    if(key === Settings.keys.ipfsPattern) {
      if(
        this.ipfsConversion == null
        || this.ipfsConversion === ''
      ) {
        if(typeof localStorage !== 'undefined') {
          localStorage.removeItem(Settings.keys.ipfsPattern)
        }
      } else {
        localStorage.setItem(
          Settings.keys.ipfsPattern,
          this.ipfsConversion,
        )
      }
    } else if(key == null) {
      for(const key of Object.values(Settings.keys)) {
        this.save(key ?? 'Unknown Key')
      }
    } else {
      console.error(`Unknown Key: ${key}`)
    }
  }
}

export const settings = new Settings()
