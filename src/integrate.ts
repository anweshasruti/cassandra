import { Expr } from "./ast";

export function integrate(expr: Expr, variable: string): Expr {
  switch (expr.kind) {
    case "num":
      return {
        kind: "bin",
        op: "*",
        left: expr,
        right: { kind: "sym", name: variable }
      };

    case "sym":
      if (expr.name === variable) {
        return {
          kind: "bin",
          op: "/",
          left: {
            kind: "bin",
            op: "^",
            left: expr,
            right: { kind: "num", value: 2 }
          },
          right: { kind: "num", value: 2 }
        };
      }
      return {
        kind: "bin",
        op: "*",
        left: expr,
        right: { kind: "sym", name: variable }
      };

    case "bin": {
      const { op, left, right } = expr;

      if (op === "+") {
        return {
          kind: "bin",
          op: "+",
          left: integrate(left, variable),
          right: integrate(right, variable)
        };
      }

      if (op === "-") {
        return {
          kind: "bin",
          op: "-",
          left: integrate(left, variable),
          right: integrate(right, variable)
        };
      }

      if (op === "^" &&
          left.kind === "sym" &&
          left.name === variable &&
          right.kind === "num" &&
          right.value !== -1) {

        const newExp = right.value + 1;

        return {
          kind: "bin",
          op: "/",
          left: {
            kind: "bin",
            op: "^",
            left,
            right: { kind: "num", value: newExp }
          },
          right: { kind: "num", value: newExp }
        };
      }

      if (op === "/" &&
          left.kind === "num" &&
          left.value === 1 &&
          right.kind === "sym" &&
          right.name === variable) {

        return {
          kind: "func",
          name: "ln",
          arg: right
        };
      }

      return {
        kind: "num",
        value: 0
      };
    }

    case "func": {
      const inner = expr.arg;

      if (expr.name === "sin" &&
          inner.kind === "sym" &&
          inner.name === variable) {

        return {
          kind: "bin",
          op: "*",
          left: { kind: "num", value: -1 },
          right: {
            kind: "func",
            name: "cos",
            arg: inner
          }
        };
      }

      if (expr.name === "cos" &&
          inner.kind === "sym" &&
          inner.name === variable) {

        return {
          kind: "func",
          name: "sin",
          arg: inner
        };
      }

      if (expr.name === "exp" &&
          inner.kind === "sym" &&
          inner.name === variable) {

        return {
          kind: "func",
          name: "exp",
          arg: inner
        };
      }

      return {
        kind: "num",
        value: 0
      };
    }
  }
}
