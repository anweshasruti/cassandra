import { Expr } from "./ast";

function num(n: number): Expr {
  return { kind: "num", value: n };
}

function sym(s: string): Expr {
  return { kind: "sym", name: s };
}

function bin(op: string, left: Expr, right: Expr): Expr {
  return { kind: "bin", op, left, right };
}

function func(name: string, arg: Expr): Expr {
  return { kind: "func", name, arg };
}

export function differentiate(expr: Expr, v: string): Expr {
  switch (expr.kind) {
    case "num":
      return num(0);

    case "sym":
      return num(expr.name === v ? 1 : 0);

    case "bin": {
      const u = expr.left;
      const w = expr.right;
      const du = differentiate(u, v);
      const dw = differentiate(w, v);

      switch (expr.op) {
        case "+":
          return bin("+", du, dw);

        case "-":
          return bin("-", du, dw);

        case "*":
          return bin("+",
            bin("*", du, w),
            bin("*", u, dw)
          );

        case "/":
          return bin("/",
            bin("-",
              bin("*", du, w),
              bin("*", u, dw)
            ),
            bin("^", w, num(2))
          );

        case "^":
          // General rule: d(u^w) = u^w ( w' ln(u) + w u'/u )
          return bin("*",
            expr,
            bin("+",
              bin("*", dw, func("ln", u)),
              bin("*", w, bin("/", du, u))
            )
          );
      }
    }

    case "func": {
      const u = expr.arg;
      const du = differentiate(u, v);

      switch (expr.name) {
        case "sin":
          return bin("*", func("cos", u), du);

        case "cos":
          return bin("*",
            bin("*", num(-1), func("sin", u)),
            du
          );

        case "exp":
          return bin("*", func("exp", u), du);

        case "ln":
          return bin("*", bin("/", num(1), u), du);

        default:
          throw new Error("Unknown function: " + expr.name);
      }
    }
  }

  throw new Error("Unsupported expression");
}
