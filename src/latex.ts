import { Expr } from "./ast";

export function toLatex(expr: Expr): string {
  switch (expr.kind) {
    case "num":
      return expr.value.toString();

    case "sym":
      if (expr.name === "pi") return "\\pi";
      return expr.name;

    case "bin":
      if (expr.op === "+") {
        return `${toLatex(expr.left)} + ${toLatex(expr.right)}`;
      }

      if (expr.op === "-") {
        return `${toLatex(expr.left)} - ${toLatex(expr.right)}`;
      }

      if (expr.op === "*") {
        return `${toLatex(expr.left)} \\cdot ${toLatex(expr.right)}`;
      }

      if (expr.op === "/") {
        return `\\frac{${toLatex(expr.left)}}{${toLatex(expr.right)}}`;
      }

      if (expr.op === "^") {
        return `${toLatex(expr.left)}^{${toLatex(expr.right)}}`;
      }

      return "";
      
    case "func":
      return `\\${expr.name}\\left(${toLatex(expr.arg)}\\right)`;
  }
}
