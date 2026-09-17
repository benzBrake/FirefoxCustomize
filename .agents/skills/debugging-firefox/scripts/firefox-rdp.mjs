import net from "node:net";

function validateTimeout(timeoutMs) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 2147483647) {
    throw new TypeError("Firefox RDP timeoutMs must be an integer from 1 to 2147483647");
  }
}

export function encodePacket(packet) {
  const json = JSON.stringify(packet);
  return Buffer.from(`${Buffer.byteLength(json)}:${json}`, "utf8");
}

export function createPacketDecoder(onPacket) {
  let buffer = Buffer.alloc(0);
  return chunk => {
    buffer = Buffer.concat([buffer, chunk]);
    for (;;) {
      const colon = buffer.indexOf(58);
      if (colon < 0 && buffer.length < 200) return;
      if (colon < 0 || colon >= 200) throw new Error("Invalid RDP frame header");
      const prefix = buffer.subarray(0, colon).toString("ascii");
      if (!/^(0|[1-9]\d*)$/.test(prefix)) throw new Error(`Invalid RDP frame length: ${prefix}`);
      const length = Number(prefix);
      if (!Number.isSafeInteger(length) || length > 2 ** 40) {
        throw new Error(`Invalid RDP frame length: ${prefix}`);
      }
      const end = colon + 1 + length;
      if (buffer.length < end) return;
      onPacket(JSON.parse(buffer.subarray(colon + 1, end).toString("utf8")));
      buffer = buffer.subarray(end);
    }
  };
}

export class FirefoxRdpClient {
  constructor({ host = "127.0.0.1", port, localPort, timeoutMs = 30000 } = {}) {
    if (host !== "127.0.0.1") throw new TypeError("Firefox RDP client only accepts 127.0.0.1");
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new TypeError("Firefox RDP port must be an integer from 1 to 65535");
    }
    validateTimeout(timeoutMs);
    if (localPort !== undefined &&
        (!Number.isInteger(localPort) || localPort < 0 || localPort > 65535)) {
      throw new TypeError("Firefox RDP localPort must be an integer from 0 to 65535");
    }
    Object.assign(this, { host, port, localPort, timeoutMs });
    this.tcpAccepted = false;
    this.packets = [];
    this.waiters = [];
    this.terminalError = null;
    this.evaluationTail = Promise.resolve();
  }

  deliver(packet) {
    const index = this.waiters.findIndex(waiter => waiter.predicate(packet));
    if (index < 0) return this.packets.push(packet);
    const [waiter] = this.waiters.splice(index, 1);
    clearTimeout(waiter.timer);
    waiter.resolve(packet);
  }

  next(predicate, timeoutMs = this.timeoutMs, label = "RDP packet") {
    validateTimeout(timeoutMs);
    if (this.terminalError) return Promise.reject(this.terminalError);
    const index = this.packets.findIndex(predicate);
    if (index >= 0) return Promise.resolve(this.packets.splice(index, 1)[0]);
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve, reject };
      waiter.timer = setTimeout(() => {
        const pending = this.waiters.indexOf(waiter);
        if (pending >= 0) this.waiters.splice(pending, 1);
        const error = new Error(`${label} timed out after ${timeoutMs} ms`);
        this.terminate(error);
        this.socket?.destroy();
        reject(error);
      }, timeoutMs);
      this.waiters.push(waiter);
    });
  }

  send(packet) {
    if (!this.socket || this.socket.destroyed) throw new Error("RDP socket is not connected");
    this.socket.write(encodePacket(packet));
  }

  async connect() {
    if (this.socket) throw new Error("RDP client already connected");
    const options = { host: this.host, port: this.port, localAddress: "127.0.0.1" };
    if (this.localPort !== undefined) options.localPort = this.localPort;
    this.socket = net.createConnection(options);
    this.socketClosed = false;
    this.socket.setKeepAlive(true, 10000);
    const decode = createPacketDecoder(packet => this.deliver(packet));
    this.socket.on("data", chunk => {
      try {
        decode(chunk);
      } catch (error) {
        this.terminate(error);
        this.socket.destroy();
      }
    });
    this.socket.on("error", error => this.terminate(error));
    this.socket.on("close", () => {
      this.socketClosed = true;
      this.terminate(new Error("RDP socket closed"));
    });
    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(
          new Error(`TCP connection timed out after ${this.timeoutMs} ms`)), this.timeoutMs);
        this.socket.once("connect", () => {
          clearTimeout(timer);
          this.tcpAccepted = true;
          resolve();
        });
        this.socket.once("error", error => {
          clearTimeout(timer);
          reject(error);
        });
      });
      this.hello = await this.next(packet => packet.from === "root" && packet.applicationType,
        this.timeoutMs, "root greeting");
      this.send({ to: "root", type: "listProcesses" });
      const processes = await this.next(packet => packet.from === "root" && (packet.processes || packet.error),
        this.timeoutMs, "listProcesses");
      if (processes.error) throw new Error(`listProcesses failed: ${processes.message || processes.error}`);
      const parent = processes.processes.find(process => process.isParent);
      if (!parent) throw new Error("Firefox RDP did not expose a parent-process descriptor");
      this.send({ to: parent.actor, type: "getTarget" });
      const response = await this.next(packet => packet.from === parent.actor && (packet.process || packet.error),
        this.timeoutMs, "getTarget");
      if (response.error) throw new Error(`getTarget failed: ${response.message || response.error}`);
      this.consoleActor = response.process.consoleActor;
      if (!this.consoleActor) throw new Error("Firefox RDP target did not expose a console actor");
      await this.evaluate("void 0");
      return this.hello;
    } catch (error) {
      this.terminate(error);
      this.socket.destroy();
      await this.close();
      throw error;
    }
  }

  evaluate(text, timeoutMs = this.timeoutMs) {
    validateTimeout(timeoutMs);
    const evaluation = this.evaluationTail.then(async () => {
      if (this.terminalError) throw this.terminalError;
      if (!this.consoleActor) throw new Error("RDP parent-process target is not attached");
      this.send({ to: this.consoleActor, type: "evaluateJSAsync", text, disableBreaks: true });
      const ack = await this.next(packet => packet.from === this.consoleActor &&
        ((packet.resultID && packet.type !== "evaluationResult") || packet.error), timeoutMs,
        "evaluateJSAsync");
      if (ack.error) throw new Error(`evaluateJSAsync failed: ${ack.message || ack.error}`);
      const result = await this.next(packet => packet.from === this.consoleActor &&
        ((packet.type === "evaluationResult" && packet.resultID === ack.resultID) || packet.error), timeoutMs,
        "evaluateJSAsync");
      if (result.error) throw new Error(`evaluateJSAsync failed: ${result.message || result.error}`);
      if (result.hasException) throw new Error(result.exceptionMessage || "Firefox evaluation failed");
      return result.result;
    });
    this.evaluationTail = evaluation.catch(() => {});
    return evaluation;
  }

  async evaluateJson(text, timeoutMs = this.timeoutMs) {
    const result = await this.evaluate(text, timeoutMs);
    if (typeof result !== "string") throw new TypeError("Firefox evaluation did not return JSON text");
    return JSON.parse(result);
  }

  async pollJson(text, predicate, {
    intervalMs = 250,
    label = "Firefox predicate",
    timeoutMs = this.timeoutMs,
  } = {}) {
    validateTimeout(timeoutMs);
    const deadline = Date.now() + timeoutMs;
    let value;
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        const error = new Error(`${label} timed out after ${timeoutMs} ms: ${JSON.stringify(value)}`);
        this.terminate(error);
        this.socket?.destroy();
        reject(error);
      }, timeoutMs);
    });
    try {
      return await Promise.race([timeout, (async () => {
        while (Date.now() < deadline) {
          value = await this.evaluateJson(text,
            Math.max(1, Math.min(this.timeoutMs, deadline - Date.now())));
          if (predicate(value)) return value;
          await new Promise(resolve => setTimeout(resolve,
            Math.max(0, Math.min(intervalMs, deadline - Date.now()))));
        }
        return timeout;
      })()]);
    } finally {
      clearTimeout(timer);
    }
  }

  failWaiters(error) {
    for (const waiter of this.waiters.splice(0)) {
      clearTimeout(waiter.timer);
      waiter.reject(error);
    }
  }

  terminate(error) {
    this.terminalError ||= error;
    this.failWaiters(this.terminalError);
  }

  async close() {
    if (!this.socket || this.socketClosed) return;
    const closed = new Promise(resolve => this.socket.once("close", resolve));
    if (!this.socket.destroyed) this.socket.end();
    const timer = setTimeout(() => this.socket.destroy(), 2000);
    await closed;
    clearTimeout(timer);
    this.socketClosed = true;
  }
}
