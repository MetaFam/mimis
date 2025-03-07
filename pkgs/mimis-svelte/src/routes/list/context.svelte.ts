import { page } from '$app/state'

class Context {
  #settings = $state(new Map())
  #functions = $state(new Map())
  #items = $state(new Map())
  #activeId = $state<number | null>(null)

  #debug = true // page.url.searchParams.has('debug')

  #keys = {
    single: Symbol('single'),
    showAll: Symbol('showAll'),
  }

  getSetting(key: symbol) {
    if(!this.#initialized) this.#initialize()
    return this.#settings.get(key)
  }
  setSetting(key: symbol, value: unknown) {
    console.debug({ setting: { [key.toString()]: value } })
    return this.#settings.set(key, value)
  }

  set single(single: boolean) {
    this.setSetting(this.#keys.single, single)
  }
  get single() {
    return this.getSetting(this.#keys.single) as boolean
  }

  set showAll(showAll: boolean) {
    this.setSetting(this.#keys.showAll, showAll)
  }
  get showAll() {
    return this.getSetting(this.#keys.showAll) as boolean
  }

  #initialized = false
  #initialize() {
    this.#initialized = true
    this.single = true
    this.showAll = false
  }

  register(
    func: (...args: Array<unknown | null>) => unknown,
    options?: { itemId: number },
  ) {
    const { itemId } = options ?? {}
    if(this.#debug) console.debug(
      { registering: { itemId, name: func.name } }
    )
    if(itemId == null) {
      this.#functions.set(func.name, func)
    } else {
      if(this.#items.get(itemId) == null) {
        this.#items.set(itemId, {})
      }
      if(this.retrieve(func.name, { itemId }) != null) {
        console.warn(`Redefining function: ${func.name} for item: ${itemId}`)
      }
      this.#items.get(itemId)[func.name] = func
    }
  }
  retrieve(
    name: string | null,
    options?: { itemId?: number, useActive?: boolean },
  ) {
    const { itemId, useActive } = options ?? {}
    if(name == null && itemId == null && useActive != true) {
      throw new Error(
        'At least one of `name`, `itemId`, or `useActive` required.'
      )
    }
    const id = useActive ? this.activeId : itemId
    if(name == null) {
      if(this.#debug) console.debug({ retrieving: { itemId, useActive } })
      return this.#items.get(id)
    }
    if(itemId == null && useActive != true) {
      if(this.#debug) console.debug({ retrieving: { name } })
      return this.#functions.get(name)
    }
    return this.#items.get(id)[name]
  }

  set activeId(id: number | null) {
    if(this.#debug) console.debug({ activeId: id })
    this.#activeId = id
  }
  get activeId() {
    return this.#activeId
  }
}

export default new Context()