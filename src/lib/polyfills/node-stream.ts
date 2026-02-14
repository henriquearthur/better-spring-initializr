export class Readable {
  static fromWeb(stream: unknown) {
    return stream
  }
}

export class PassThrough {
  pipe() {
    return this
  }

  on() {
    return this
  }

  write() {
    return true
  }

  end() {}
}

export class Duplex extends PassThrough {}

export class Transform extends Duplex {}

export class Writable extends Duplex {}
