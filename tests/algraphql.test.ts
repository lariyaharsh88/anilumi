import { test } from "node:test";
import assert from "node:assert/strict";
import { shapeOf, combine, groupByQuery, type Job } from "../lib/algraphql";

const STAFF = "query($id:Int,$p:Int){Staff(id:$id){id name{full} characterMedia(page:$p,perPage:50){edges{characterRole}}}}";
const MEDIA = "query($id:Int){Media(id:$id,type:ANIME){duration}}";
const job = (query: string, variables: Record<string, unknown>, id = JSON.stringify(variables)): Job => ({ _id: id, op: "x", query, variables });

test("shapeOf finds the variables, the root selection and its field", () => {
  assert.deepEqual(shapeOf(MEDIA), { vars: "$id:Int", inner: "Media(id:$id,type:ANIME){duration}", root: "Media" });
  assert.equal(shapeOf(STAFF)?.root, "Staff");
  assert.equal(shapeOf("{Media(id:1){id}}"), null); // no variable list: not batchable
});

test("combine aliases each job and renames every variable use", () => {
  const c = combine([job(STAFF, { id: 1, p: 1 }), job(STAFF, { id: 2, p: 2 })])!;
  assert.equal(c.root, "Staff");
  assert.equal(
    c.query,
    "query($id_0:Int,$p_0:Int,$id_1:Int,$p_1:Int){q0:Staff(id:$id_0){id name{full} characterMedia(page:$p_0,perPage:50){edges{characterRole}}} q1:Staff(id:$id_1){id name{full} characterMedia(page:$p_1,perPage:50){edges{characterRole}}}}",
  );
  assert.deepEqual(c.variables, { id_0: 1, p_0: 1, id_1: 2, p_1: 2 });
});

test("combine refuses mixed shapes; groupByQuery puts the largest group first", () => {
  assert.equal(combine([job(STAFF, { id: 1, p: 1 }), job(MEDIA, { id: 2 })]), null);
  const groups = groupByQuery([job(MEDIA, { id: 1 }), job(STAFF, { id: 1, p: 1 }), job(MEDIA, { id: 2 })]);
  assert.deepEqual(groups.map((g) => g.length), [2, 1]);
  assert.equal(groups[0][0].query, MEDIA);
});
