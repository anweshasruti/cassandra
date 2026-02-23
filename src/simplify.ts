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

      if (expr.op === "+") {
        if (left.kind === "num" && left.value === 0) return right;
        if (right.kind === "num" && right.value === 0) return left;

        if (left.kind === "num" && right.kind === "num") {
          return { kind: "num", value: left.value + right.value };
        }

        return { kind: "bin", op: "+", left, right };
      }

      if (expr.op === "-") {
        if (right.kind === "num" && right.value === 0) return left;

        if (left.kind === "num" && right.kind === "num") {
          return { kind: "num", value: left.value - right.value };
        }

        return { kind: "bin", op: "-", left, right };
      }

      if (expr.op === "*") {
        if (left.kind === "num" && left.value === 0) return { kind: "num", value: 0 };
        if (right.kind === "num" && right.value === 0) return { kind: "num", value: 0 };

        if (left.kind === "num" && left.value === 1) return right;
        if (right.kind === "num" && right.value === 1) return left;

        if (left.kind === "num" && right.kind === "num") {
          return { kind: "num", value: left.value * right.value };
        }

        return { kind: "bin", op: "*", left, right };
      }

      if (expr.op === "/") {
        if (left.kind === "num" && left.value === 0) return { kind: "num", value: 0 };

        if (right.kind === "num" && right.value === 1) return left;

        if (left.kind === "num" && right.kind === "num") {
          return { kind: "num", value: left.value / right.value };
        }

        return { kind: "bin", op: "/", left, right };
      }

      if (expr.op === "^") {
        if (right.kind === "num" && right.value === 1) return left;
        if (right.kind === "num" && right.value === 0) return { kind: "num", value: 1 };

        if (left.kind === "num" && right.kind === "num") {
          return { kind: "num", value: Math.pow(left.value, right.value) };
        }

        return { kind: "bin", op: "^", left, right };
      }

      return { kind: "bin", op: expr.op, left, right };
    }
  }
}
