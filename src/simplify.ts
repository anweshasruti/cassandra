import { Expr } from "./ast";

export function simplify(expr: Expr): Expr {
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

    case "bin": {
      const left = simplify(expr.left);
      const right = simplify(expr.right);

      if (left.kind === "num" && right.kind === "num") {
        switch (expr.op) {
          case "+": return { kind: "num", value: left.value + right.value };
          case "-": return { kind: "num", value: left.value - right.value };
          case "*": return { kind: "num", value: left.value * right.value };
          case "/": return { kind: "num", value: left.value / right.value };
          case "^": return { kind: "num", value: Math.pow(left.value, right.value) };
        }
      }

      if (expr.op === "+") {
        if (left.kind === "num" && left.value === 0) return right;
        if (right.kind === "num" && right.value === 0) return left;
      }

      if (expr.op === "*") {
        if (left.kind === "num" && left.value === 0) return { kind: "num", value: 0 };
        if (right.kind === "num" && right.value === 0) return { kind: "num", value: 0 };
        if (left.kind === "num" && left.value === 1) return right;
        if (right.kind === "num" && right.value === 1) return left;
      }

      if (expr.op === "^") {
        if (right.kind === "num" && right.value === 0)
          return { kind: "num", value: 1 };
        if (right.kind === "num" && right.value === 1)
          return left;
      }

      return {
        kind: "bin",
        op: expr.op,
        left,
        right
      };
    }
  }
}
