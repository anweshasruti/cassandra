import { Expr } from "./ast";

type Poly = Map<number, number>;

function num(n: number): Expr {
  return { kind: "num", value: n };
}

function sym(name: string): Expr {
  return { kind: "sym", name };
}

function bin(op: string, left: Expr, right: Expr): Expr {
  return { kind: "bin", op, left, right };
}

/* ================= POLYNOMIAL UTILITIES ================= */

function clone(p: Poly): Poly {
  return new Map(p);
}

function clean(p: Poly): Poly {
  for (const [d, c] of p)
    if (Math.abs(c) < 1e-12) p.delete(d);
  if (p.size === 0) p.set(0, 0);
  return p;
}

function degree(p: Poly): number {
  return Math.max(...p.keys());
}

function addPoly(a: Poly, b: Poly): Poly {
  const r = clone(a);
  for (const [d, c] of b)
    r.set(d, (r.get(d) || 0) + c);
  return clean(r);
}

function subPoly(a: Poly, b: Poly): Poly {
  const r = clone(a);
  for (const [d, c] of b)
    r.set(d, (r.get(d) || 0) - c);
  return clean(r);
}

function mulPoly(a: Poly, b: Poly): Poly {
  const r = new Map<number, number>();
  for (const [d1, c1] of a)
    for (const [d2, c2] of b)
      r.set(d1 + d2, (r.get(d1 + d2) || 0) + c1 * c2);
  return clean(r);
}

function scalePoly(a: Poly, k: number): Poly {
  const r = new Map<number, number>();
  for (const [d, c] of a)
    r.set(d, c * k);
  return clean(r);
}

/* ---------- Euclidean Algorithm ---------- */

function divPoly(a: Poly, b: Poly): [Poly, Poly] {
  let r = clone(a);
  const q = new Map<number, number>();

  const db = degree(b);
  const cb = b.get(db)!;

  while (degree(r) >= db && !(r.size === 1 && r.get(0) === 0)) {
    const dr = degree(r);
    const cr = r.get(dr)!;

    const d = dr - db;
    const c = cr / cb;

    q.set(d, (q.get(d) || 0) + c);

    const term = new Map<number, number>();
    term.set(d, c);

    r = subPoly(r, mulPoly(term, b));
  }

  return [clean(q), clean(r)];
}

function gcdPoly(a: Poly, b: Poly): Poly {
  let A = clone(a);
  let B = clone(b);

  while (!(B.size === 1 && B.get(0) === 0)) {
    const [, r] = divPoly(A, B);
    A = B;
    B = r;
  }

  const lead = A.get(degree(A))!;
  return scalePoly(A, 1 / lead);
}

/* ================= POLY CONVERSION ================= */

function isPoly(expr: Expr, v: string): boolean {
  switch (expr.kind) {
    case "num": return true;
    case "sym": return expr.name === v;
    case "bin":
      if (["+","-","*"].includes(expr.op))
        return isPoly(expr.left, v) && isPoly(expr.right, v);
      if (expr.op === "^")
        return expr.left.kind === "sym" &&
               expr.left.name === v &&
               expr.right.kind === "num";
      return false;
    default: return false;
  }
}

function toPoly(expr: Expr, v: string): Poly {
  if (expr.kind === "num") {
    const p = new Map<number, number>();
    p.set(0, expr.value);
    return p;
  }

  if (expr.kind === "sym") {
    const p = new Map<number, number>();
    p.set(1, 1);
    return p;
  }

  if (expr.kind === "bin") {
    const A = toPoly(expr.left, v);
    const B = toPoly(expr.right, v);

    if (expr.op === "+") return addPoly(A, B);
    if (expr.op === "-") return subPoly(A, B);
    if (expr.op === "*") return mulPoly(A, B);

    if (expr.op === "^") {
      let r = new Map<number, number>();
      r.set(0, 1);
      for (let i = 0; i < (expr.right as any).value; i++)
        r = mulPoly(r, A);
      return r;
    }
  }

  throw Error();
}

function fromPoly(p: Poly, v: string): Expr {
  const terms: Expr[] = [];

  const sorted = [...p.entries()]
    .filter(([_,c]) => Math.abs(c) > 1e-12)
    .sort((a,b) => b[0] - a[0]);

  for (const [deg, coeff] of sorted) {
    let term: Expr;

    if (deg === 0) term = num(coeff);
    else if (deg === 1)
      term = coeff === 1
        ? sym(v)
        : bin("*", num(coeff), sym(v));
    else
      term = coeff === 1
        ? bin("^", sym(v), num(deg))
        : bin("*", num(coeff), bin("^", sym(v), num(deg)));

    terms.push(term);
  }

  if (terms.length === 0) return num(0);
  return terms.reduce((a,b)=>bin("+",a,b));
}

/* ================= MAIN SIMPLIFIER ================= */

export function simplify(expr: Expr): Expr {

  if (expr.kind === "bin" && expr.op === "/") {
    const A = expr.left;
    const B = expr.right;

    if (isPoly(A,"x") && isPoly(B,"x")) {
      const pA = toPoly(A,"x");
      const pB = toPoly(B,"x");

      const g = gcdPoly(pA, pB);

      const [nA] = divPoly(pA, g);
      const [nB] = divPoly(pB, g);

      if (degree(nB) === 0 && nB.get(0) === 1)
        return fromPoly(nA,"x");

      return bin("/",
        fromPoly(nA,"x"),
        fromPoly(nB,"x")
      );
    }
  }

  if (isPoly(expr,"x")) {
    return fromPoly(toPoly(expr,"x"),"x");
  }

  switch (expr.kind) {
    case "num":
    case "sym":
      return expr;

    case "func":
      return {
        kind: "func",
        name: expr.name,
        arg: simplify(expr.arg)
      };

    case "bin":
      return bin(
        expr.op,
        simplify(expr.left),
        simplify(expr.right)
      );
  }
}
