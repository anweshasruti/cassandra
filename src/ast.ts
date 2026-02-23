export type Expr =
  | Num
  | Sym
  | Binary
  | Func;

export interface Num {
  kind: "num";
  value: number;
}

export interface Sym {
  kind: "sym";
  name: string;
}

export interface Binary {
  kind: "bin";
  op: "+" | "-" | "*" | "/" | "^";
  left: Expr;
  right: Expr;
}

export interface Func {
  kind: "func";
  name: string;
  arg: Expr;
}
