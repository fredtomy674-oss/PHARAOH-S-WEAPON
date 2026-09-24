import { createServer, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { QdrantVectorStore, pointUuid } from "../../src/modules/rag/qdrant.js";
import { cosine } from "../../src/modules/rag/vectorStore.js";
import type { CurriculumScope } from "../../src/modules/rag/types.js";

/**
 * PHASE 21 (D-025) — QdrantVectorStore against an IN-PROCESS fake Qdrant
 * server (real HTTP, no Docker): the adapter's wire contract (collection
 * ensure, points upsert/delete/search, payload scope filter) is exercised for
 * real, while everything stays offline and deterministic.
 */

interface FakePoint {
  vector: number[];
  payload: Record<string, string>;
}

function startFakeQdrant(): Promise<{ baseUrl: string; close: () => Promise<void>; dim: () => number | undefined; pointCount: () => number; collectionCreated: () => boolean }> {
  const points = new Map<string, FakePoint>();
  let collectionDim: number | undefined;
  let created = false;
  let server: Server;

  const json = (res: ServerResponse, status: number, body: unknown) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };

  return new Promise((resolve) => {
    server = createServer((req, res) => {
      const method = req.method ?? "GET";
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      const segments = url.pathname.split("/").filter(Boolean);

      if (segments[0] !== "collections" || segments.length < 2) {
        json(res, 404, { status: { error: "Not found" } });
        return;
      }
      const name = segments[1];
      const collectionPath = `/collections/${name}`;
      const fullPath = url.pathname.startsWith(`${collectionPath}/points`) ? "points" : "collection";

      const readBody = (): Promise<unknown> =>
        new Promise((resolveBody, rejectBody) => {
          const chunks: Buffer[] = [];
          req.on("data", (c: Buffer) => chunks.push(c));
          req.on("end", () => {
            try {
              resolveBody(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
            } catch (err) {
              rejectBody(err);
            }
          });
          req.on("error", rejectBody);
        });

      void (async () => {
        if (fullPath === "collection") {
          if (method === "GET") {
            if (!created) {
              json(res, 404, { status: { error: "Not found: collection" } });
              return;
            }
            json(res, 200, { result: { status: "green", config: { params: { vectors: { size: collectionDim } } } }, status: "ok" });
            return;
          }
          if (method === "PUT") {
            const body = (await readBody()) as { vectors?: { size?: number } };
            collectionDim = body.vectors?.size;
            created = true;
            json(res, 200, { result: true, status: "ok" });
            return;
          }
          json(res, 405, { status: { error: "Method not allowed" } });
          return;
        }

        if (method === "PUT") {
          const body = (await readBody()) as { points?: Array<{ id: string; vector: number[]; payload: Record<string, string> }> };
          for (const point of body.points ?? []) {
            if (collectionDim !== undefined && point.vector.length !== collectionDim) {
              json(res, 400, { status: { error: `Wrong input: vectors size ${point.vector.length} does not match collection dimension ${collectionDim}` } });
              return;
            }
            points.set(point.id, { vector: point.vector, payload: point.payload ?? {} });
          }
          json(res, 200, { result: { status: "acknowledged" }, status: "ok" });
          return;
        }

        if (method === "POST" && url.pathname.endsWith("/points/delete")) {
          const body = (await readBody()) as { filter?: { must?: Array<{ key: string; match: { value: string } }> } };
          const must = body.filter?.must ?? [];
          for (const [id, point] of points) {
            const matches = must.every((cond) => point.payload[cond.key] === cond.match.value);
            if (matches) points.delete(id);
          }
          json(res, 200, { result: { status: "completed" }, status: "ok" });
          return;
        }

        if (method === "POST" && url.pathname.endsWith("/points/search")) {
          const body = (await readBody()) as { vector: number[]; limit: number; filter?: { must?: Array<{ key: string; match: { value: string } }> } };
          const must = body.filter?.must ?? [];
          const hits = [...points.entries()]
            .filter(([, p]) => must.every((cond) => p.payload[cond.key] === cond.match.value))
            .map(([id, p]) => ({ id, p, score: cosine(body.vector, p.vector) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, body.limit)
            .map(({ id, p, score }) => ({ id, score, payload: { chunkId: p.payload.chunkId } }));
          json(res, 200, { result: hits, status: "ok" });
          return;
        }

        json(res, 404, { status: { error: "Not found" } });
      })().catch(() => json(res, 500, { status: { error: "fake server error" } }));
    });

    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise<void>((r) => server.close(() => r())),
        dim: () => collectionDim,
        pointCount: () => points.size,
        collectionCreated: () => created,
      });
    });
  });
}

const SCOPE_BASE: CurriculumScope = {
  countryId: "EG",
  educationSystemId: "basic",
  gradeId: "g6",
  subjectId: "math",
  curriculumId: "cur-2024",
  lessonId: "les-1",
};

const vectorOf = (seed: number, dim = 8): number[] => {
  const v = Array.from({ length: dim }, (_, i) => Math.sin(seed * (i + 1) + 1));
  const norm = Math.sqrt(v.reduce((acc, x) => acc + x * x, 0)) || 1;
  return v.map((x) => x / norm);
};

let fake: { baseUrl: string; close: () => Promise<void>; dim: () => number | undefined; pointCount: () => number; collectionCreated: () => boolean } | null = null;

afterEach(async () => {
  if (fake) {
    await fake.close();
    fake = null;
  }
});

describe("QdrantVectorStore (PHASE 21 — vector store adapter over HTTP)", () => {
  it("auto-creates the collection on first upsert and searches a roundtrip back", async () => {
    fake = await startFakeQdrant();
    const store = new QdrantVectorStore({ url: fake.baseUrl });
    const query = vectorOf(1);

    await store.upsert({ chunkId: "chk_alpha", embedding: vectorOf(1), model: "mock-hash-64", scope: SCOPE_BASE });
    expect(fake.collectionCreated()).toBe(true);
    expect(fake.dim()).toBe(8);

    const hits = await store.search({ query, scope: SCOPE_BASE, topK: 5 });
    expect(hits).toHaveLength(1);
    expect(hits[0]!.chunkId).toBe("chk_alpha");
    expect(hits[0]!.score).toBeCloseTo(1, 3);
  });

  it("applies the scope payload filter — other-lesson chunks never leak", async () => {
    fake = await startFakeQdrant();
    const store = new QdrantVectorStore({ url: fake.baseUrl });
    await store.upsert({ chunkId: "chk_in_lesson", embedding: vectorOf(1), model: "m", scope: { ...SCOPE_BASE, lessonId: "les-1" } });
    await store.upsert({ chunkId: "chk_other_lesson", embedding: vectorOf(1), model: "m", scope: { ...SCOPE_BASE, lessonId: "les-2" } });

    // Same vector for both — only the payload scope discriminates.
    const hits = await store.search({ query: vectorOf(1), scope: { ...SCOPE_BASE, lessonId: "les-1" }, topK: 5 });
    expect(hits.map((h) => h.chunkId)).toEqual(["chk_in_lesson"]);

    // Empty scope (no filter keys) returns everything — matches SQLite laziness,
    // though callers always pass a validated full scope.
    const all = await store.search({ query: vectorOf(1), scope: {}, topK: 5 });
    expect(all).toHaveLength(2);
  });

  it("uses deterministic point ids — re-upserting replaces, never duplicates", async () => {
    fake = await startFakeQdrant();
    const store = new QdrantVectorStore({ url: fake.baseUrl });
    await store.upsert({ chunkId: "chk_stable", embedding: vectorOf(2), model: "m", scope: SCOPE_BASE });
    await store.upsert({ chunkId: "chk_stable", embedding: vectorOf(3), model: "m", scope: SCOPE_BASE });
    expect(fake.pointCount()).toBe(1);
    expect(pointUuid("chk_stable")).toBe(pointUuid("chk_stable"));
    expect(pointUuid("chk_stable")).not.toBe(pointUuid("chk_other"));
  });

  it("remove deletes by chunkId payload (and unknown ids are a no-op)", async () => {
    fake = await startFakeQdrant();
    const store = new QdrantVectorStore({ url: fake.baseUrl });
    await store.upsert({ chunkId: "chk_gone", embedding: vectorOf(4), model: "m", scope: SCOPE_BASE });
    await store.upsert({ chunkId: "chk_kept", embedding: vectorOf(4), model: "m", scope: SCOPE_BASE });

    await store.remove("chk_gone");
    const hits = await store.search({ query: vectorOf(4), scope: SCOPE_BASE, topK: 5 });
    expect(hits.map((h) => h.chunkId)).toEqual(["chk_kept"]);

    await store.remove("chk_never_existed"); // 404 on delete → fine, no throw
  });

  it("searches an empty/uncreated collection as an empty result", async () => {
    fake = await startFakeQdrant();
    const store = new QdrantVectorStore({ url: fake.baseUrl });
    const hits = await store.search({ query: vectorOf(1), scope: SCOPE_BASE, topK: 5 });
    expect(hits).toEqual([]);
  });

  it("rejects a dimension mismatch against QDRANT_DIMENSION before touching the wire", async () => {
    fake = await startFakeQdrant();
    const store = new QdrantVectorStore({ url: fake.baseUrl, dimension: 16 });
    await expect(store.upsert({ chunkId: "chk_bad", embedding: vectorOf(1, 8), model: "m" })).rejects.toMatchObject({
      code: "VECTOR_DIMENSION_MISMATCH",
    });
  });

  it("surfaces upsert failures (e.g. server dimension rejection) as 503", async () => {
    fake = await startFakeQdrant();
    const store = new QdrantVectorStore({ url: fake.baseUrl, dimension: 16 });
    await store.upsert({ chunkId: "chk_dim16", embedding: vectorOf(1, 16), model: "m", scope: SCOPE_BASE }); // creates dim-16 collection
    const second = new QdrantVectorStore({ url: fake.baseUrl }); // no fixed dim → adopts 16 from collection
    await expect(second.upsert({ chunkId: "chk_wrong_dim", embedding: vectorOf(2, 8), model: "m", scope: SCOPE_BASE })).rejects.toMatchObject({
      code: "VECTOR_STORE_UNAVAILABLE",
    });
  });

  it("network failure: upsert throws 503, search degrades to []", async () => {
    const dead = new QdrantVectorStore({
      url: "http://127.0.0.1:1",
      fetchImpl: async () => {
        throw new Error("ECONNREFUSED");
      },
    });
    await expect(dead.upsert({ chunkId: "chk_x", embedding: vectorOf(1), model: "m" })).rejects.toMatchObject({
      code: "VECTOR_STORE_UNAVAILABLE",
    });
    const hits = await dead.search({ query: vectorOf(1), scope: SCOPE_BASE, topK: 5 });
    expect(hits).toEqual([]);
    await expect(dead.remove("chk_x")).rejects.toMatchObject({ code: "VECTOR_STORE_UNAVAILABLE" });
  });
});