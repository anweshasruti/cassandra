import { Expr } from "./ast";

function num(n: number): Expr {
  return { kind: "num", value: n };
}

function bin(op: string, left: Expr, right: Expr): Expr {
  return { kind: "bin", op, left, right };
}

function isNum(e: Expr): e is { kind: "num", value: number } {
  return e.kind === "num";
}

function flatten(op: string, expr: Expr): Expr[] {
  if (expr.kind === "bin" && expr.op === op) {
    return [...flatten(op, expr.left), ...flatten(op, expr.right)];
  }
  return [expr];
}

function sortKey(e: Expr): string {
  return JSON.stringify(e);
}

export function simplify(expr: Expr): Expr {
  switch (expr.kind) {
    case "num":
    case "sym":
      return expr;

    case "func":
      return { kind: "func", name: expr.name, arg: simplify(expr.arg) };

    case "bin": {
      const left = simplify(expr.left);
      const right = simplify(expr.right);

      if (expr.op === "+") {
        let terms = flatten("+", bin("+", left, right));

        let constant = 0;
        let others: Expr[] = [];

        for (const t of terms) {
          if (isNum(t)) constant += t.value;
          else others.push(t);
        }

        if (constant !== 0) others.push(num(constant));
        if (others.length === 0) return num(0);
        if (others.length === 1) return others[0];

        others.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

        return others.reduce((a, b) => bin("+", a, b));
      }

      if (expr.op === "*") {
        let factors = flatten("*", bin("*", left, right));

        let constant = 1;
        let others: Expr[] = [];

        for (const f of factors) {
          if (isNum(f)) constant *= f.value;
          else others.push(f);
        }

        if (constant === 0) return num(0);
        if (constant !== 1) others.unshift(num(constant));

        if (others.length === 0) return num(1);
        if (others.length === 1) return others[0];

        others.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

        return others.reduce((a, b) => bin("*", a, b));
      }

      if (expr.op === "-") {
        return simplify(bin("+", left, bin("*", num(-1), right)));
      }

      if (expr.op === "/") {
        if (isNum(left) && isNum(right))
          return num(left.value / right.value);
        return bin("/", left, right);
      }

      if (expr.op === "^") {
        if (isNum(right) && right.value === 0) return num(1);
        if (isNum(right) && right.value === 1) return left;
        if (isNum(left) && isNum(right))
          return num(Math.pow(left.value, right.value));
        return bin("^", left, right);
      }

      return bin(expr.op, left, right);
    }
  }
}
