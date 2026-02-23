import { Token } from "./tokenizer";
import { Expr } from "./ast";

export class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Expr {
    return this.parseAddSub();
  }

  private peek(): Token | null {
    return this.tokens[this.pos] || null;
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  private parseAddSub(): Expr {
    let expr = this.parseMulDiv();

    while (
      this.peek() &&
      this.peek()!.type === "operator" &&
      (this.peek()!.value === "+" || this.peek()!.value === "-")
    ) {
      const op = this.consume().value as "+" | "-";
      const right = this.parseMulDiv();
      expr = { kind: "bin", op, left: expr, right };
    }

    return expr;
  }

  private parseMulDiv(): Expr {
    let expr = this.parsePower();

    while (
      this.peek() &&
      this.peek()!.type === "operator" &&
      (this.peek()!.value === "*" || this.peek()!.value === "/")
    ) {
      const op = this.consume().value as "*" | "/";
      const right = this.parsePower();
      expr = { kind: "bin", op, left: expr, right };
    }

    return expr;
  }

  private parsePower(): Expr {
    let expr = this.parseUnary();

    if (this.peek()?.value === "^") {
      this.consume();
      const right = this.parsePower();
      expr = { kind: "bin", op: "^", left: expr, right };
    }

    return expr;
  }

  private parseUnary(): Expr {
    if (this.peek()?.value === "-") {
      this.consume();
      const arg = this.parseUnary();
      return {
        kind: "bin",
        op: "*",
        left: { kind: "num", value: -1 },
        right: arg
      };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): Expr {
    const token = this.consume();

    if (token.type === "number") {
      return { kind: "num", value: Number(token.value) };
    }

    if (token.type === "identifier") {
      if (this.peek()?.value === "(") {
        this.consume();
        const arg = this.parseAddSub();
        this.consume();
        return { kind: "func", name: token.value, arg };
      }

      return { kind: "sym", name: token.value };
    }

    if (token.value === "(") {
      const expr = this.parseAddSub();
      this.consume();
      return expr;
    }

    throw new Error("Unexpected token");
  }
}
