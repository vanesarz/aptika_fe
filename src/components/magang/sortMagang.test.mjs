import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const compiled = ts.transpileModule(fs.readFileSync(new URL("./sortMagang.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exported = {};
vm.runInNewContext(compiled, { exports: exported, Intl, Date });
const { sortMagang } = exported;
const rows = [
  { id: 99, nama: "Zahra", nama_kampus: "Universitas B", created_at: "2026-11-01T09:00:00Z", updated_at: "2026-11-15T09:00:00Z" },
  { id: 1, nama: "Alya", nama_kampus: "Universitas Z", created_at: "2026-11-10T10:00:00Z" },
  { id: 2, nama: "Bima", nama_kampus: "Universitas A", created_at: "2026-11-09T10:00:00Z" },
];
const ids = sort => Array.from(sortMagang(rows, sort), row => row.id);
assert.deepEqual(ids("terbaru"), [1, 2, 99], "Registration time takes priority over ID and edit time");
assert.deepEqual(ids("terlama"), [99, 2, 1]);
assert.deepEqual(ids("nama_az"), [1, 2, 99]);
assert.deepEqual(ids("nama_za"), [99, 2, 1]);
assert.deepEqual(ids("kampus_az"), [2, 99, 1]);
assert.deepEqual(ids("kampus_za"), [1, 99, 2]);
assert.deepEqual(rows.map(row => row.id), [99, 1, 2], "Sorting must not mutate fetched records");
console.log("7 sorting checks passed");
