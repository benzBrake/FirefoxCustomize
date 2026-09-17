import assert from "node:assert/strict";
import { EventEmitter, once } from "node:events";
import net from "node:net";
import test from "node:test";

import {
  createPacketDecoder,
  encodePacket,
  FirefoxRdpClient,
} from "./firefox-rdp.mjs";

async function createEvaluationServer(onEvaluate) {
  const state = { connections: 0 };
  const server = net.createServer(socket => {
    state.connections++;
    const send = packet => socket.write(encodePacket(packet));
    const decode = createPacketDecoder(packet => {
      if (packet.type === "listProcesses") {
        send({ from: "root", processes: [{ actor: "process1", isParent: true }] });
      } else if (packet.type === "getTarget") {
        send({ from: "process1", process: { actor: "target1", consoleActor: "console1" } });
      } else if (packet.type === "evaluateJSAsync") {
        onEvaluate({ packet, send, socket });
      }
    });
    socket.on("data", decode);
    send({ from: "root", applicationType: "browser" });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return { server, state };
}

async function closeServer(server) {
  server.close();
  await once(server, "close");
}

async function createCapabilityFailureServer(capability, sendError) {
  const server = net.createServer(socket => {
    const send = packet => socket.write(encodePacket(packet));
    const decode = createPacketDecoder(packet => {
      if (packet.type === "listProcesses") {
        if (capability !== "listProcesses") {
          send({ from: "root", processes: [{ actor: "process1", isParent: true }] });
        } else if (sendError) {
          send({ from: "root", error: "unrecognizedPacketType", message: "unsupported request" });
        }
      } else if (packet.type === "getTarget") {
        if (capability !== "getTarget") {
          send({ from: "process1", process: { actor: "target1", consoleActor: "console1" } });
        } else if (sendError) {
          send({ from: "process1", error: "unrecognizedPacketType", message: "unsupported request" });
        }
      } else if (packet.type === "evaluateJSAsync" && sendError) {
        send({ from: "console1", error: "unrecognizedPacketType", message: "unsupported request" });
      }
    });
    socket.on("data", decode);
    send({ from: "root", applicationType: "browser" });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return server;
}

test("decodes split and coalesced UTF-8 packets as bytes", () => {
  const actual = [];
  const decode = createPacketDecoder(packet => actual.push(packet));
  const split = encodePacket({ from: "root", text: "调试成功" });
  const coalesced = Buffer.concat([
    encodePacket({ from: "console1", value: 42 }),
    encodePacket({ from: "console1", value: 43 }),
  ]);

  for (const byte of split) decode(Buffer.from([byte]));
  decode(coalesced);

  assert.deepEqual(actual, [
    { from: "root", text: "调试成功" },
    { from: "console1", value: 42 },
    { from: "console1", value: 43 },
  ]);
});

test("rejects non-loopback targets before connecting", () => {
  assert.throws(
    () => new FirefoxRdpClient({ host: "192.0.2.1" }),
    /only accepts 127\.0\.0\.1/,
  );
});

test("requires an explicit valid caller-selected port", () => {
  for (const port of [undefined, -1, 0, 65536, 1.5, "6000"]) {
    assert.throws(
      () => new FirefoxRdpClient({ port }),
      /port must be an integer from 1 to 65535/,
    );
  }
});

test("requires a valid timer range", () => {
  for (const timeoutMs of [1, 2147483647]) {
    assert.doesNotThrow(() => new FirefoxRdpClient({ port: 6000, timeoutMs }));
  }
  for (const timeoutMs of [0, -1, 2147483648, 1.5, NaN, Infinity, "1000"]) {
    assert.throws(
      () => new FirefoxRdpClient({ port: 6000, timeoutMs }),
      /timeoutMs must be an integer from 1 to 2147483647/,
    );
  }
});

test("validates timeout overrides before protocol work", async () => {
  for (const run of [
    client => client.next(() => false, 0),
    client => client.evaluate("40 + 2", 0),
    client => client.pollJson("status", () => false, { timeoutMs: 0 }),
  ]) {
    const client = new FirefoxRdpClient({ port: 6000 });
    await assert.rejects(Promise.resolve().then(() => run(client)),
      /timeoutMs must be an integer from 1 to 2147483647/);
  }
});

test("validates an optional caller-selected local port", () => {
  assert.doesNotThrow(() => new FirefoxRdpClient({ port: 6000, localPort: 0 }));
  for (const localPort of [-1, 65536, 1.5, NaN, Infinity, "6000"]) {
    assert.throws(
      () => new FirefoxRdpClient({ port: 6000, localPort }),
      /localPort must be an integer from 0 to 65535/,
    );
  }
});

test("distinguishes refusal before TCP acceptance", async () => {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await closeServer(server);
  const client = new FirefoxRdpClient({ port, timeoutMs: 250 });

  try {
    await assert.rejects(client.connect(), /ECONNREFUSED/);
    assert.equal(client.tcpAccepted, false);
  } finally {
    await client.close();
  }
});

test("bounds TCP establishment and waits for socket closure", async () => {
  const originalCreateConnection = net.createConnection;
  const socket = new EventEmitter();
  socket.destroyed = false;
  socket.setKeepAlive = () => {};
  socket.destroy = () => {
    socket.destroyed = true;
    setImmediate(() => socket.emit("close"));
  };
  net.createConnection = () => socket;
  const client = new FirefoxRdpClient({ port: 6000, timeoutMs: 20 });

  try {
    await assert.rejects(Promise.race([
      client.connect(),
      new Promise((_, reject) => setTimeout(
        () => reject(new Error("test guard expired")), 250)),
    ]), /TCP connection timed out after 20 ms/);
    assert.equal(client.tcpAccepted, false);
    assert.equal(socket.destroyed, true);
  } finally {
    net.createConnection = originalCreateConnection;
    if (!socket.destroyed) socket.destroy();
    await client.close();
  }
});

test("close waits when socket destruction started before close", async () => {
  const client = new FirefoxRdpClient({ port: 6000 });
  const socket = new EventEmitter();
  socket.destroyed = true;
  client.socket = socket;
  let resolved = false;
  const closing = client.close().then(() => { resolved = true; });

  await new Promise(resolve => setImmediate(resolve));
  assert.equal(resolved, false);
  socket.emit("close");
  await closing;
  assert.equal(resolved, true);
});

test("records TCP acceptance before a missing root greeting", async () => {
  let connections = 0;
  const server = net.createServer(() => connections++);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const client = new FirefoxRdpClient({ port: server.address().port, timeoutMs: 20 });

  try {
    await assert.rejects(client.connect(), /root greeting timed out/);
    assert.equal(client.tcpAccepted, true);
    assert.equal(connections, 1);
  } finally {
    await client.close();
    await closeServer(server);
  }
});

for (const capability of ["listProcesses", "getTarget", "evaluateJSAsync"]) {
  for (const sendError of [true, false]) {
    test(`${capability} ${sendError ? "protocol errors" : "timeouts"} name the capability`, async () => {
      const server = await createCapabilityFailureServer(capability, sendError);
      const client = new FirefoxRdpClient({ port: server.address().port, timeoutMs: 250 });

      try {
        await assert.rejects(
          client.connect(),
          new RegExp(`${capability} ${sendError ? "failed: unsupported request" : "timed out"}`),
        );
      } finally {
        await client.close();
        await closeServer(server);
      }
    });
  }
}

test("uses one socket and serializes evaluations with competing result IDs", async () => {
  let connections = 0;
  let evaluation = 0;
  let activeEvaluations = 0;
  let maximumActiveEvaluations = 0;
  const server = net.createServer(socket => {
    connections++;
    const send = packet => {
      const frame = encodePacket(packet);
      socket.write(frame.subarray(0, 3));
      socket.write(frame.subarray(3));
    };
    const decode = createPacketDecoder(packet => {
      if (packet.type === "listProcesses") {
        send({ from: "root", processes: [{ actor: "process1", isParent: true }] });
      } else if (packet.type === "getTarget") {
        send({ from: "process1", process: { actor: "target1", consoleActor: "console1" } });
        send({ from: "console1", type: "consoleAPICall", message: "unrelated" });
      } else if (packet.type === "evaluateJSAsync") {
        evaluation++;
        activeEvaluations++;
        maximumActiveEvaluations = Math.max(maximumActiveEvaluations, activeEvaluations);
        const resultID = `evaluation${evaluation}`;
        send({ from: "console1", type: "evaluationResult", resultID: "stale", result: -1 });
        send({ from: "otherActor", resultID: "wrongActor" });
        send({ from: "console1", resultID });
        setTimeout(() => {
          send({ from: "console1", type: "evaluationResult", resultID: "wrongResult", result: -2 });
          send({ from: "console1", type: "tabNavigated", state: "stop" });
          send({ from: "console1", type: "evaluationResult", resultID,
            hasException: false, result: 42 });
          activeEvaluations--;
        }, 5);
      }
    });
    socket.on("data", decode);
    send({ from: "root", applicationType: "browser", traits: { label: "中文" } });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const client = new FirefoxRdpClient({
    port: server.address().port,
    timeoutMs: 1000,
  });
  await client.connect();
  assert.deepEqual(await client.next(
    packet => packet.from === "console1" && packet.type === "consoleAPICall",
  ), { from: "console1", type: "consoleAPICall", message: "unrelated" });
  assert.deepEqual(await Promise.all([
    client.evaluate("40 + 2"),
    client.evaluate("6 * 7"),
  ]), [42, 42]);
  await client.close();

  assert.equal(connections, 1);
  assert.equal(evaluation, 3);
  assert.equal(maximumActiveEvaluations, 1);
  server.close();
  await once(server, "close");
});

test("connects and evaluates without starting console listeners", async () => {
  let listenerRequests = 0;
  const server = net.createServer(socket => {
    const send = packet => socket.write(encodePacket(packet));
    const decode = createPacketDecoder(packet => {
      if (packet.type === "listProcesses") {
        send({ from: "root", processes: [{ actor: "process1", isParent: true }] });
      } else if (packet.type === "getTarget") {
        send({ from: "process1", process: { actor: "target1", consoleActor: "console1" } });
      } else if (packet.type === "startListeners" || packet.type === "stopListeners") {
        listenerRequests++;
        send({ from: "console1", error: "unrecognizedPacketType" });
      } else if (packet.type === "evaluateJSAsync") {
        send({ from: "console1", resultID: "evaluation1" });
        send({ from: "console1", type: "evaluationResult", resultID: "evaluation1",
          hasException: false, result: 42 });
      }
    });
    socket.on("data", decode);
    send({ from: "root", applicationType: "browser" });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const client = new FirefoxRdpClient({ port: server.address().port, timeoutMs: 1000 });

  try {
    await client.connect();
    assert.equal(await client.evaluate("40 + 2"), 42);
  } finally {
    await client.close();
    await closeServer(server);
  }
  assert.equal(listenerRequests, 0);
});

test("reuses one socket for JSON evaluation and bounded predicate polling", async () => {
  let evaluations = 0;
  const { server, state } = await createEvaluationServer(({ packet, send }) => {
    const resultID = `evaluation${++evaluations}`;
    send({ from: "console1", resultID });
    send({
      from: "console1",
      type: "evaluationResult",
      resultID,
      hasException: false,
      result: packet.text === "snapshot"
        ? JSON.stringify({ tabs: 52 })
        : JSON.stringify({ ready: evaluations >= 3 }),
    });
  });
  const client = new FirefoxRdpClient({ port: server.address().port, timeoutMs: 1000 });

  try {
    await client.connect();
    assert.deepEqual(await client.evaluateJson("snapshot"), { tabs: 52 });
    assert.deepEqual(await client.pollJson("status", value => value.ready, {
      intervalMs: 1,
      label: "feature readiness",
      timeoutMs: 1000,
    }), { ready: true });
    assert.equal(evaluations, 3);
    assert.equal(state.connections, 1);
  } finally {
    await client.close();
    await closeServer(server);
  }
});

test("packet timeout invalidates the client before late evaluation replies", async () => {
  let evaluations = 0;
  const { server } = await createEvaluationServer(({ packet, send, socket }) => {
    if (packet.text === "void 0") {
      send({ from: "console1", resultID: "preflight" });
      send({ from: "console1", type: "evaluationResult", resultID: "preflight",
        hasException: false, result: 0 });
      return;
    }
    const resultID = `evaluation${++evaluations}`;
    setTimeout(() => {
      if (socket.destroyed) return;
      send({ from: "console1", resultID });
      send({ from: "console1", type: "evaluationResult", resultID,
        hasException: false, result: evaluations });
    }, 60);
  });
  const client = new FirefoxRdpClient({ port: server.address().port, timeoutMs: 250 });

  try {
    await client.connect();
    await assert.rejects(client.evaluate("first", 20),
      /evaluateJSAsync timed out after 20 ms/);
    await assert.rejects(client.evaluate("second", 20),
      /evaluateJSAsync timed out after 20 ms/);
    assert.equal(evaluations, 1);
    assert.equal(client.socket.destroyed, true);
  } finally {
    await client.close();
    await closeServer(server);
  }
});

test("poll timeout includes time queued behind an earlier evaluation", async () => {
  let evaluations = 0;
  const { server } = await createEvaluationServer(({ packet, send, socket }) => {
    const resultID = `evaluation${++evaluations}`;
    send({ from: "console1", resultID });
    const reply = () => {
      if (socket.destroyed) return;
      send({ from: "console1", type: "evaluationResult", resultID,
        hasException: false, result: JSON.stringify({ ready: true }) });
    };
    if (packet.text === "block") setTimeout(reply, 60);
    else reply();
  });
  const client = new FirefoxRdpClient({ port: server.address().port, timeoutMs: 1000 });

  try {
    await client.connect();
    const results = await Promise.allSettled([
      client.evaluate("block"),
      client.pollJson("status", value => value.ready, {
        intervalMs: 1,
        label: "queued readiness",
        timeoutMs: 20,
      }),
    ]);
    assert.equal(results[0].status, "rejected");
    assert.match(results[0].reason.message, /queued readiness timed out after 20 ms/);
    assert.equal(results[1].status, "rejected");
    assert.match(results[1].reason.message, /queued readiness timed out after 20 ms/);
    assert.equal(evaluations, 2);
    assert.equal(client.socket.destroyed, true);
  } finally {
    await client.close();
    await closeServer(server);
  }
});

test("rejects malformed frame lengths", () => {
  const decode = createPacketDecoder(() => {});
  assert.throws(() => decode(Buffer.from("nope:{}")), /RDP frame length/);
});

test("rejects an incomplete RDP header at Firefox's 200-byte limit", () => {
  const decode = createPacketDecoder(() => {});
  decode(Buffer.alloc(199, 49));
  assert.throws(() => decode(Buffer.from("1")), /RDP frame header/);
});

test("accepts Firefox's packet-length limit and rejects one byte more", () => {
  const atLimit = createPacketDecoder(() => {});
  assert.doesNotThrow(() => atLimit(Buffer.from(`${2 ** 40}:`)));
  const aboveLimit = createPacketDecoder(() => {});
  assert.throws(() => aboveLimit(Buffer.from(`${2 ** 40 + 1}:`)), /RDP frame length/);
});

test("turns malformed server frames into connection failures", async () => {
  let connections = 0;
  const server = net.createServer(socket => {
    connections++;
    socket.write("nope:{}");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const client = new FirefoxRdpClient({
    port: server.address().port,
    timeoutMs: 1000,
  });
  await assert.rejects(client.connect(), /RDP frame length/);
  await client.close();

  assert.equal(connections, 1);
  server.close();
  await once(server, "close");
});
