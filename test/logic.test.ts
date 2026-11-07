import { emptyBoard, addItem, moveItem, moveToPosition, removeItem, sanitizeBoard, type Board } from "../src/model.ts";
import { encodeBoard, decodeBoard } from "../src/url.ts";

const b = emptyBoard();
addItem(b, "Alpha", undefined, "A");
addItem(b, "Beta", "https://x.test/beta", "A");
addItem(b, "Gamma", undefined, "C");
addItem(b, "Delta", undefined, "C");

const byText = (t: string) => b.items.find((i) => i.text === t)!.id;

// within-tier move: Gamma is first in C -> no-op
moveItem(b, byText("Gamma"), "up");
if (b.items.filter((i) => i.tier === "C")[0].text !== "Gamma") throw new Error("gamma up should noop");

// Delta up -> before Gamma
moveItem(b, byText("Delta"), "up");
if (b.items.filter((i) => i.tier === "C")[0].text !== "Delta") throw new Error("delta up failed");

// Gamma right -> D
moveItem(b, byText("Gamma"), "right");
if (b.items.find((i) => i.text === "Gamma")!.tier !== "D") throw new Error("gamma -> D failed");

// Gamma left x2 -> B
moveItem(b, byText("Gamma"), "left");
moveItem(b, byText("Gamma"), "left");
if (b.items.find((i) => i.text === "Gamma")!.tier !== "B") throw new Error("gamma -> B failed");

// B -> A -> S, then noop at S
moveItem(b, byText("Gamma"), "left");
moveItem(b, byText("Gamma"), "left");
moveItem(b, byText("Gamma"), "left");
if (b.items.find((i) => i.text === "Gamma")!.tier !== "S") throw new Error("gamma should be at S");

// drop Delta into A before Beta
moveToPosition(b, byText("Delta"), "A", byText("Beta"));
const a = b.items.filter((i) => i.tier === "A").map((i) => i.text).join(",");
if (a !== "Alpha,Delta,Beta") throw new Error("drop before Beta failed: " + a);

// drop into empty tier F
moveToPosition(b, byText("Alpha"), "F", null);
if (b.items.filter((i) => i.tier === "F").map((i) => i.text).join() !== "Alpha") throw new Error("drop into F failed");

// remove
removeItem(b, byText("Beta"));
if (b.items.some((i) => i.text === "Beta")) throw new Error("remove failed");

// ---- URL roundtrip ----
b.title = "Cute Girls That Like Me: かわいい";
const enc = encodeBoard(b);
const dec = decodeBoard(enc) as Board;
if (dec === null) throw new Error("decode returned null");
if (JSON.stringify(dec) !== JSON.stringify(b)) throw new Error("roundtrip mismatch");
console.log(`roundtrip OK, urlLen=${enc.length}`);

// ---- sanitize bad input ----
if (decodeBoard("garbage!!!") !== null) throw new Error("garbage should be null");
const bad = JSON.stringify({ title: 42, items: "nope" });
if (sanitizeBoard(JSON.parse(bad)) !== null) throw new Error("bad board should be null");
const ok = sanitizeBoard({ title: "t", items: [{ text: "x", tier: "Q", id: 5 }, { text: "", tier: "S" }, { text: "y", link: "javascript:alert(1)" }] });
if (!ok) throw new Error("sanitizable board rejected");
if (ok.items.length !== 2) throw new Error("expected 2 valid items");
if (ok.items[1].tier !== "C") throw new Error("invalid tier should default to C");
if (ok.items[1].link !== undefined) throw new Error("non-http link should be stripped");

console.log("ALL TESTS PASSED");
