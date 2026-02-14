export class AsyncLocalStorage<TStore> {
  private store: TStore | undefined

  disable() {
    this.store = undefined
  }

  getStore(): TStore | undefined {
    return this.store
  }

  run<TResult>(store: TStore, callback: (...args: any[]) => TResult, ...args: any[]): TResult {
    const previousStore = this.store
    this.store = store

    try {
      return callback(...args)
    } finally {
      this.store = previousStore
    }
  }

  enterWith(store: TStore) {
    this.store = store
  }
}
