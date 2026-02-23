import { Expr } from "./ast";

export function differentiate(expr: Expr, variable: string): Expr {
  switch (expr.kind) {
    case "num":
      return { kind: "num", value: 0 };

    case "sym":
      return {
        kind: "num",
        value: expr.name === variable ? 1 : 0
      };

    case "bin": {
      const { op, left, right } = expr;

      if (op === "+") {
        return {
          kind: "bin",
          op: "+",
          left: differentiate(left, variable),
          right: differentiate(right, variable)
        };
      }

      if (op === "-") {
        return {
          kind: "bin",
          op: "-",
          left: differentiate(left, variable),
          right: differentiate(right, variable)
        };
      }

      if (op === "*") {
        return {
          kind: "bin",
          op: "+",
          left: {
            kind: "bin",
            op: "*",
            left: differentiate(left, variable),
            right
          },
          right: {
            kind: "bin",
            op: "*",
            left,
            right: differentiate(right, variable)
          }
        };
      }

      if (op === "^" && right.kind === "num") {
        return {
          kind: "bin",
          op: "*",
          left: {
            kind: "bin",
            op: "*",
            left: { kind: "num", value: right.value },
            right: {
              kind: "bin",
              op: "^",
              left,
              right: { kind: "num", value: right.value - 1 }
            }
          },
          right: differentiate(left, variable)
        };
      }

      return { kind: "num", value: 0 };
    }

    case "func": {
      const inner = expr.arg;
      const dInner = differentiate(inner, variable);

      if (expr.name === "sin") {
        return {
          kind: "bin",
          op: "*",
          left: {
            kind: "func",
            name: "cos",
            arg: inner
          },
          right: dInner
        };
      }

      if (expr.name === "cos") {
        return {
          kind: "bin",
          op: "*",
          left: {
            kind: "bin",
            op: "*",
            left: { kind: "num", value: -1 },
            right: {
              kind: "func",
              name: "sin",
              arg: inner
            }
          },
          right: dInner
        };
      }

      if (expr.name === "exp") {
        return {
          kind: "bin",
          op: "*",
          left: {
            kind: "func",
            name: "exp",
            arg: inner
          },
          right: dInner
        };
      }

      if (expr.name === "ln") {
        return {
          kind: "bin",
          op: "*",
          left: {
            kind: "bin",
            op: "/",
            left: { kind: "num", value: 1 },
            right: inner
          },
          right: dInner
        };
      }

      return { kind: "num", value: 0 };
    }
  }
}
