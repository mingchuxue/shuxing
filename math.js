/* 表达式解析、求值、特征点与圆锥曲线分析 */
(function (root) {
  "use strict";

  var PI = Math.PI, E = Math.E, TAU = 2 * PI, EPS = 1e-10, INF = Infinity;

  var FNS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    asinh: Math.asinh, acosh: Math.acosh, atanh: Math.atanh,
    ln: Math.log, log: logFn, lg: Math.log10, log10: Math.log10,
    lb: Math.log2, log2: Math.log2, exp: Math.exp,
    sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs,
    floor: Math.floor, ceil: Math.ceil, round: Math.round,
    sign: Math.sign, sgn: Math.sign, atan2: Math.atan2,
    min: Math.min, max: Math.max, hypot: Math.hypot,
    sec: function (x) { return 1 / Math.cos(x); },
    csc: function (x) { return 1 / Math.sin(x); },
    cot: function (x) { return 1 / Math.tan(x); }
  };

  function logFn(a, b) {
    if (b == null) return Math.log10(a);
    return Math.log(b) / Math.log(a);
  }

  var CONST = { pi: PI, π: PI, e: E, tau: TAU, τ: TAU };
  var FN_NAMES = Object.create(null);
  Object.keys(FNS).forEach(function (k) { FN_NAMES[k] = true; });

  var INDEP = { x: 1, y: 1, t: 1, theta: 1, θ: 1 };

  function isLetter(c) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_" ||
      c === "π" || c === "θ" || c === "τ" || c === "φ" || c === "ω" || c === "α" || c === "β" || c === "γ";
  }
  function isDigit(c) { return c >= "0" && c <= "9"; }
  function isIdentStart(c) { return isLetter(c); }
  function isIdentPart(c) { return isLetter(c) || isDigit(c); }

  function tokenize(src) {
    var s = String(src).replace(/π/g, "π").replace(/[−–—]/g, "-").replace(/[×⋅·]/g, "*").replace(/÷/g, "/").replace(/≤/g, "<=").replace(/≥/g, ">=").replace(/≠/g, "!=").replace(/，/g, ",").replace(/；/g, ";");
    s = s.replace(/√\s*/g, "sqrt");
    var i = 0, n = s.length, out = [];
    while (i < n) {
      var c = s[i];
      if (c === " " || c === "\t" || c === "\n" || c === "\r") { i++; continue; }
      if (isDigit(c) || (c === "." && i + 1 < n && isDigit(s[i + 1]))) {
        var j = i;
        while (i < n && isDigit(s[i])) i++;
        if (s[i] === ".") { i++; while (i < n && isDigit(s[i])) i++; }
        if (s[i] === "e" || s[i] === "E") {
          var k = i + 1;
          if (s[k] === "+" || s[k] === "-") k++;
          if (k < n && isDigit(s[k])) {
            i = k;
            while (i < n && isDigit(s[i])) i++;
          }
        }
        out.push({ t: "num", v: parseFloat(s.slice(j, i)) });
        continue;
      }
      if (isIdentStart(c)) {
        var a = i; i++;
        while (i < n && isIdentPart(s[i])) i++;
        var name = s.slice(a, i);
        var low = name.toLowerCase();
        if (low === "pi") name = "π";
        else if (low === "theta") name = "θ";
        else if (low === "tau") name = "τ";
        else if (low === "if") { out.push({ t: "kw", v: "if" }); name = null; }
        else if (FN_NAMES[low]) out.push({ t: "fn", v: low }), name = null;
        if (name !== null) out.push({ t: "ident", v: name });
        continue;
      }
      if (c === "*" && s[i + 1] === "*") { out.push({ t: "op", v: "^" }); i += 2; continue; }
      if (c === "<" && s[i + 1] === "=") { out.push({ t: "op", v: "<=" }); i += 2; continue; }
      if (c === ">" && s[i + 1] === "=") { out.push({ t: "op", v: ">=" }); i += 2; continue; }
      if (c === "!" && s[i + 1] === "=") { out.push({ t: "op", v: "!=" }); i += 2; continue; }
      if (c === "=" && s[i + 1] === "=") { out.push({ t: "op", v: "==" }); i += 2; continue; }
      if (c === "&" && s[i + 1] === "&") { out.push({ t: "op", v: "&&" }); i += 2; continue; }
      if (c === "|" && s[i + 1] === "|") { out.push({ t: "op", v: "||" }); i += 2; continue; }
      if (c === "|") { out.push({ t: "bar" }); i++; continue; }
      if ("+-*/^=(),?:<>{};".indexOf(c) >= 0) { out.push({ t: "op", v: c }); i++; continue; }
      throw new Error("无法识别的符号「" + c + "」");
    }
    return out;
  }

  function classifyBars(toks) {
    var depth = 0;
    for (var i = 0; i < toks.length; i++) {
      if (toks[i].t !== "bar") continue;
      var prev = i > 0 ? toks[i - 1] : null;
      var afterValue = prev && (prev.t === "num" || prev.t === "ident" || prev.t === "absend" || (prev.t === "op" && (prev.v === ")" || prev.v === "]")));
      if (afterValue && depth > 0) { toks[i] = { t: "absend" }; depth--; }
      else { toks[i] = { t: "absbeg" }; depth++; }
    }
    if (depth !== 0) throw new Error("绝对值符号不匹配");
    return toks;
  }

  function valueLike(tk) {
    if (!tk) return false;
    return tk.t === "num" || tk.t === "ident" || tk.t === "absend" || (tk.t === "op" && tk.v === ")");
  }
  function startLike(tk) {
    if (!tk) return false;
    return tk.t === "num" || tk.t === "ident" || tk.t === "fn" || tk.t === "absbeg" || (tk.t === "op" && tk.v === "(");
  }

  function endsWithFnPower(out) {
    var i = out.length - 1;
    if (i < 0) return false;
    function skipAtom(i) {
      if (i < 0) return -1;
      if (out[i].t === "num" || out[i].t === "ident") return i;
      if (out[i].t === "op" && out[i].v === ")") {
        var d = 1;
        for (var j = i - 1; j >= 0; j--) {
          if (out[j].t === "op" && out[j].v === ")") d++;
          if (out[j].t === "op" && out[j].v === "(") { d--; if (!d) return j; }
        }
        return -1;
      }
      return -1;
    }
    var a = skipAtom(i);
    if (a < 0) return false;
    a--;
    while (a >= 0 && out[a].t === "op" && (out[a].v === "+" || out[a].v === "-")) a--;
    if (a < 0 || !(out[a].t === "op" && out[a].v === "^")) return false;
    return a >= 1 && out[a - 1].t === "fn";
  }
  function insertMul(toks) {
    var out = [];
    for (var i = 0; i < toks.length; i++) {
      if (out.length && valueLike(out[out.length - 1]) && startLike(toks[i])) {
        if (!(toks[i].t === "op" && toks[i].v === "(" && endsWithFnPower(out))) out.push({ t: "op", v: "*" });
      }
      out.push(toks[i]);
    }
    return out;
  }

  function Parser(toks) {
    this.t = toks;
    this.i = 0;
  }
  Parser.prototype.peek = function () { return this.t[this.i] || null; };
  Parser.prototype.peekv = function () { var p = this.peek(); return p && p.t === "op" ? p.v : null; };
  Parser.prototype.eat = function (v) {
    var p = this.peek();
    if (!p || p.t !== "op" || p.v !== v) throw new Error("此处应为 " + v);
    this.i++;
  };
  Parser.prototype.done = function () { return this.i >= this.t.length; };

  Parser.prototype.parse = function () {
    if (this.done()) throw new Error("表达式为空");
    var e = this.parseEq();
    if (!this.done()) throw new Error("表达式末尾有多余内容");
    return e;
  };
  Parser.prototype.parseEq = function () {
    var a = this.parseTern();
    if (this.peekv() === "=") {
      this.i++;
      var b = this.parseTern();
      return { k: "eq", a: a, b: b };
    }
    return a;
  };
  Parser.prototype.parseTern = function () {
    var c = this.parseOr();
    if (this.peekv() === "?") {
      this.i++;
      var a = this.parseTern();
      this.eat(":");
      var b = this.parseTern();
      return { k: "tern", c: c, a: a, b: b };
    }
    return c;
  };
  Parser.prototype.parseOr = function () {
    var a = this.parseAnd();
    while (this.peekv() === "||") { this.i++; a = { k: "op", op: "||", a: a, b: this.parseAnd() }; }
    return a;
  };
  Parser.prototype.parseAnd = function () {
    var a = this.parseCmp();
    while (this.peekv() === "&&") { this.i++; a = { k: "op", op: "&&", a: a, b: this.parseCmp() }; }
    return a;
  };
  Parser.prototype.parseCmp = function () {
    var a = this.parseAdd();
    var v = this.peekv();
    if (v === "<" || v === ">" || v === "<=" || v === ">=" || v === "==" || v === "!=") {
      this.i++;
      return { k: "op", op: v, a: a, b: this.parseAdd() };
    }
    return a;
  };
  Parser.prototype.parseAdd = function () {
    var a = this.parseMul();
    for (;;) {
      var v = this.peekv();
      if (v === "+" || v === "-") { this.i++; a = { k: "op", op: v, a: a, b: this.parseMul() }; }
      else break;
    }
    return a;
  };
  Parser.prototype.parseMul = function () {
    var a = this.parseUnary();
    for (;;) {
      var v = this.peekv();
      if (v === "*" || v === "/") { this.i++; a = { k: "op", op: v, a: a, b: this.parseUnary() }; }
      else break;
    }
    return a;
  };
  Parser.prototype.parseUnary = function () {
    var v = this.peekv();
    if (v === "+" || v === "-") { this.i++; return { k: "un", op: v, a: this.parseUnary() }; }
    return this.parsePow();
  };
  Parser.prototype.parsePow = function () {
    var a = this.parsePrim();
    if (this.peekv() === "^") { this.i++; a = { k: "op", op: "^", a: a, b: this.parseUnary() }; }
    return a;
  };
  Parser.prototype.parsePrim = function () {
    var p = this.peek();
    if (!p) throw new Error("表达式不完整");
    if (p.t === "num") { this.i++; return { k: "num", v: p.v }; }
    if (p.t === "ident") { this.i++; return { k: "var", n: p.v }; }
    if (p.t === "fn") return this.parseCall();
    if (p.t === "op" && p.v === "(") {
      this.i++;
      var e = this.parseTern();
      this.eat(")");
      return e;
    }
    if (p.t === "absbeg") {
      this.i++;
      var a = this.parseTern();
      if (!this.peek() || this.peek().t !== "absend") throw new Error("绝对值符号不匹配");
      this.i++;
      return { k: "call", n: "abs", args: [a] };
    }
    if (p.t === "op" && p.v === "{") return this.parsePiece();
    throw new Error("此处语法不正确");
  };
  Parser.prototype.parseCall = function () {
    var name = this.peek().v; this.i++;
    var powN = null;
    if (this.peekv() === "^") {
      this.i++;
      var ex = this.parseUnary();
      powN = ex;
    }
    var args;
    if (this.peekv() === "(") {
      this.i++;
      args = [];
      if (this.peekv() !== ")") {
        args.push(this.parseTern());
        while (this.peekv() === ",") { this.i++; args.push(this.parseTern()); }
      }
      this.eat(")");
    } else {
      args = [this.parseFnArg()];
    }
    var node = { k: "call", n: name, args: args };
    if (powN) node = { k: "op", op: "^", a: node, b: powN };
    return node;
  };
  /* 无括号函数作用于随后的乘除项之前的幂与一元（到 + - 比较 三元 为止，含乘除） */
  Parser.prototype.parseFnArg = function () {
    return this.parseMul();
  };
  function isCond(n) {
    return !!(n && n.k === "op" && /^(<|>|<=|>=|==|!=|&&|\|\|)$/.test(n.op));
  }
  Parser.prototype.parsePiecePart = function () {
    var start = this.parseTern();
    var nx = this.peek();
    if (this.peekv() === ":" && isCond(start)) {
      this.i++;
      return { expr: this.parseTern(), cond: start };
    }
    if (nx && nx.t === "kw" && nx.v === "if") {
      this.i++;
      return { expr: start, cond: this.parseTern() };
    }
    if (this.peekv() === ",") {
      this.i++;
      return { expr: start, cond: this.parseTern() };
    }
    return { expr: start, cond: null };
  };
  Parser.prototype.parsePiece = function () {
    this.eat("{");
    var parts = [];
    if (this.peekv() === "}") throw new Error("分段函数不能为空");
    while (!this.done() && this.peekv() !== "}") {
      parts.push(this.parsePiecePart());
      if (this.peekv() === ";") this.i++;
      else break;
    }
    this.eat("}");
    if (!parts.length) throw new Error("分段函数不能为空");
    return { k: "piece", parts: parts };
  };

  function parse(src) {
    var toks = insertMul(classifyBars(tokenize(src)));
    return new Parser(toks).parse();
  }

  function walk(node, fn) {
    fn(node);
    if (node.k === "op" || node.k === "eq") { walk(node.a, fn); walk(node.b, fn); }
    else if (node.k === "un") walk(node.a, fn);
    else if (node.k === "tern") { walk(node.c, fn); walk(node.a, fn); walk(node.b, fn); }
    else if (node.k === "call") node.args.forEach(function (a) { walk(a, fn); });
    else if (node.k === "piece") node.parts.forEach(function (p) { walk(p.expr, fn); if (p.cond) walk(p.cond, fn); });
  }

  function paramsOf(node, reserved) {
    var res = reserved || {};
    var set = Object.create(null);
    walk(node, function (n) {
      if (n.k === "var") {
        var low = n.n.toLowerCase();
        if (CONST[n.n] != null || CONST[low] != null) return;
        if (res[n.n] || res[low] || INDEP[n.n] || INDEP[low]) return;
        set[n.n] = true;
      }
    });
    return Object.keys(set);
  }

  function usesVar(node, name) {
    var found = false;
    walk(node, function (n) { if (n.k === "var" && n.n === name) found = true; });
    return found;
  }

  function evalNode(node, vars) {
    switch (node.k) {
      case "num": return node.v;
      case "var": {
        if (vars && vars[node.n] != null) return +vars[node.n];
        var low = node.n.toLowerCase();
        if (vars && vars[low] != null) return +vars[low];
        if (CONST[node.n] != null) return CONST[node.n];
        if (CONST[low] != null) return CONST[low];
        return NaN;
      }
      case "un": {
        var u = evalNode(node.a, vars);
        return node.op === "-" ? -u : u;
      }
      case "op": {
        var a = evalNode(node.a, vars), b = evalNode(node.b, vars);
        switch (node.op) {
          case "+": return a + b;
          case "-": return a - b;
          case "*": return a * b;
          case "/": return a / b;
          case "^": return powNum(a, b);
          case "<": return a < b ? 1 : 0;
          case ">": return a > b ? 1 : 0;
          case "<=": return a <= b ? 1 : 0;
          case ">=": return a >= b ? 1 : 0;
          case "==": return Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b)) ? 1 : 0;
          case "!=": return Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b)) ? 0 : 1;
          case "&&": return a && b ? 1 : 0;
          case "||": return a || b ? 1 : 0;
        }
        return NaN;
      }
      case "eq": return evalNode(node.a, vars) - evalNode(node.b, vars);
      case "tern": return evalNode(node.c, vars) ? evalNode(node.a, vars) : evalNode(node.b, vars);
      case "piece": {
        for (var i = 0; i < node.parts.length; i++) {
          var p = node.parts[i];
          if (!p.cond || evalNode(p.cond, vars)) return evalNode(p.expr, vars);
        }
        return NaN;
      }
      case "call": {
        var fn = FNS[node.n];
        if (!fn) return NaN;
        var args = node.args.map(function (x) { return evalNode(x, vars); });
        if (args.some(function (v) { return v == null || (typeof v === "number" && isNaN(v)); })) return NaN;
        try { return fn.apply(null, args); } catch (e) { return NaN; }
      }
    }
    return NaN;
  }

  function powNum(a, b) {
    if (a < 0 && Math.abs(b - Math.round(b)) > 1e-12) return NaN;
    return Math.pow(a, b);
  }

  function compile(node) {
    return function (vars) { return evalNode(node, vars); };
  }

  /* ---------- 采样与特征点 ---------- */
  function finite(y) { return typeof y === "number" && isFinite(y); }

  function sampleFn(fn, xmin, xmax, n) {
    n = Math.max(32, n | 0);
    var pts = new Array(n + 1);
    var dx = (xmax - xmin) / n;
    for (var i = 0; i <= n; i++) {
      var x = xmin + dx * i;
      if (i === n) x = xmax;
      var y = fn(x);
      pts[i] = { x: x, y: y };
    }
    return pts;
  }

  function isBreak(p, q, ySpan) {
    if (!finite(p.y) || !finite(q.y)) return true;
    var dy = Math.abs(q.y - p.y);
    if (dy < (ySpan || 20) * 0.55) return false;
    var dx = Math.abs(q.x - p.x) || 1e-12;
    var slope = dy / dx;
    if (p.y * q.y < 0 && Math.abs(p.y) > ySpan * 0.4 && Math.abs(q.y) > ySpan * 0.4 && dy > ySpan * 0.9) return true;
    if (dy > ySpan * 2.2 && slope > 80) return true;
    return false;
  }

  function refineZero(fn, a, b) {
    var fa = fn(a), fb = fn(b);
    if (!finite(fa) || !finite(fb) || fa * fb > 0) return null;
    for (var i = 0; i < 50; i++) {
      var m = (a + b) / 2, fm = fn(m);
      if (!finite(fm)) {
        var g = (a * 3 + b) / 4, fg = fn(g);
        if (!finite(fg)) return null;
        if (fa * fg <= 0) { b = g; fb = fg; } else { a = g; fa = fg; }
        continue;
      }
      if (Math.abs(fm) < 1e-14 || Math.abs(b - a) < 1e-12) return Math.abs(fm) < Math.abs(fn(a)) && Math.abs(fm) < Math.abs(fn(b)) ? m : (Math.abs(fn(a)) < Math.abs(fn(b)) ? a : b);
      if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; }
    }
    var x = (a + b) / 2, y = fn(x);
    if (!finite(y) || Math.abs(y) > 1e-6 * (1 + Math.abs(x))) {
      if (Math.abs(fn(a)) < 1e-8) return a;
      if (Math.abs(fn(b)) < 1e-8) return b;
      return null;
    }
    return x;
  }

  function findZeros(fn, xmin, xmax, ySpan, n) {
    var pts = sampleFn(fn, xmin, xmax, n || 800);
    var zs = [];
    for (var i = 0; i < pts.length; i++) {
      if (finite(pts[i].y) && Math.abs(pts[i].y) < 1e-12) {
        zs.push(pts[i].x);
        continue;
      }
      if (i === 0) continue;
      var p = pts[i - 1], q = pts[i];
      if (!finite(p.y) || !finite(q.y)) continue;
      if (isBreak(p, q, ySpan || 20)) continue;
      if (p.y === 0) continue;
      if (p.y * q.y < 0) {
        var z = refineZero(fn, p.x, q.x);
        if (z != null) zs.push(z);
      }
    }
    var span = xmax - xmin;
    return uniqueSorted(zs.map(function (x) { return snapNice(x, span); }), Math.max(span * 1e-6, 3e-4));
  }

  function uniqueSorted(arr, tol) {
    arr.sort(function (a, b) { return a - b; });
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      if (!out.length || Math.abs(arr[i] - out[out.length - 1]) > tol) out.push(arr[i]);
    }
    return out;
  }
  function snapNice(x, span) {
    if (!finite(x)) return x;
    if (Math.abs(x) < 3e-4) return 0;
    var h = Math.round(x * 2) / 2;
    if (Math.abs(x - h) < 3e-4) return h;
    return x;
  }

  function d1(fn, x) {
    var h = 1e-5 * (1 + Math.abs(x));
    var a = fn(x + h), b = fn(x - h);
    if (!finite(a) || !finite(b)) {
      var f0 = fn(x), f1 = fn(x + h);
      if (finite(f0) && finite(f1)) return (f1 - f0) / h;
      return NaN;
    }
    return (a - b) / (2 * h);
  }

  function d2(fn, x) {
    var h = 1e-4 * (1 + Math.abs(x));
    var a = fn(x + h), b = fn(x), c = fn(x - h);
    if (!finite(a) || !finite(b) || !finite(c)) return NaN;
    return (a - 2 * b + c) / (h * h);
  }

  function findExtrema(fn, xmin, xmax, ySpan, n) {
    var der = function (x) { return d1(fn, x); };
    var zs = findZeros(der, xmin, xmax, Math.max(20, (ySpan || 20) * 2), n || 800);
    var out = [];
    for (var i = 0; i < zs.length; i++) {
      var x = zs[i], y = fn(x), cur = d2(fn, x);
      if (!finite(y)) continue;
      var kind = "stationary";
      if (finite(cur)) {
        if (cur > 1e-8) kind = "min";
        else if (cur < -1e-8) kind = "max";
      }
      if (kind === "stationary") {
        var yl = fn(x - 1e-4), yr = fn(x + 1e-4);
        if (finite(yl) && finite(yr)) {
          if (yl > y && yr > y) kind = "min";
          else if (yl < y && yr < y) kind = "max";
          else continue;
        } else continue;
      }
      out.push({ x: x, y: y, kind: kind });
    }
    var cusps = findCusps(fn, xmin, xmax, 220);
    var tol = (xmax - xmin) * 3e-3;
    for (var j = 0; j < cusps.length; j++) {
      var cx = cusps[j], cy = fn(cx), near = false;
      if (!finite(cy)) continue;
      for (var t = 0; t < out.length; t++) if (Math.abs(out[t].x - cx) < tol) { near = true; break; }
      if (near) continue;
      var h = Math.max(1e-4, (xmax - xmin) * 1e-5);
      var yl = fn(cx - h), yr = fn(cx + h), ck = null;
      if (finite(yl) && finite(yr)) {
        if (yl > cy && yr > cy) ck = "min";
        else if (yl < cy && yr < cy) ck = "max";
      }
      if (ck) out.push({ x: cx, y: cy, kind: ck });
    }
    out.forEach(function (p) {
      p.x = snapNice(p.x, xmax - xmin);
      if (finite(p.y)) p.y = snapNice(p.y, ySpan);
    });
    return out;
  }

  function findIntersections(f, g, xmin, xmax, ySpan, n) {
    var h = function (x) { return f(x) - g(x); };
    var zs = findZeros(h, xmin, xmax, ySpan || 20, n || 800);
    return zs.map(function (x) { return { x: x, y: f(x) }; }).filter(function (p) { return finite(p.y) && finite(g(p.x)) && Math.abs(p.y - g(p.x)) < 1e-5 * (1 + Math.abs(p.y)); });
  }

  /* ---------- 隐函数：marching squares ---------- */
  function sampleImplicit(F, xmin, xmax, ymin, ymax, nx, ny) {
    nx = nx || 180; ny = ny || 120;
    var segs = [];
    var dx = (xmax - xmin) / nx, dy = (ymax - ymin) / ny;
    var grid = new Array((nx + 1) * (ny + 1));
    function at(i, j) { return grid[j * (nx + 1) + i]; }
    for (var j = 0; j <= ny; j++) {
      var y = ymin + dy * j;
      for (var i = 0; i <= nx; i++) {
        var x = xmin + dx * i;
        grid[j * (nx + 1) + i] = F(x, y);
      }
    }
    function lerp(p1, v1, p2, v2) {
      if (!finite(v1) || !finite(v2)) return null;
      var t = v1 / (v1 - v2);
      if (t < 0 || t > 1) t = t < 0 ? 0 : 1;
      return [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t];
    }
    for (j = 0; j < ny; j++) {
      for (i = 0; i < nx; i++) {
        var x0 = xmin + dx * i, y0 = ymin + dy * j, x1 = x0 + dx, y1 = y0 + dy;
        var v00 = at(i, j), v10 = at(i + 1, j), v11 = at(i + 1, j + 1), v01 = at(i, j + 1);
        if (![v00, v10, v11, v01].every(finite)) continue;
        var idx = (v00 > 0 ? 1 : 0) | (v10 > 0 ? 2 : 0) | (v11 > 0 ? 4 : 0) | (v01 > 0 ? 8 : 0);
        if (idx === 0 || idx === 15) continue;
        var e = [
          lerp([x0, y0], v00, [x1, y0], v10),
          lerp([x1, y0], v10, [x1, y1], v11),
          lerp([x0, y1], v01, [x1, y1], v11),
          lerp([x0, y0], v00, [x0, y1], v01)
        ];
        var table = {
          1: [0, 3], 2: [0, 1], 3: [3, 1], 4: [1, 2], 5: [0, 3, 1, 2], 6: [0, 2],
          7: [3, 2], 8: [3, 2], 9: [0, 2], 10: [0, 1, 3, 2], 11: [1, 2], 12: [3, 1],
          13: [0, 1], 14: [0, 3]
        };
        var p = table[idx];
        if (!p) continue;
        for (var k = 0; k < p.length; k += 2) {
          var a = e[p[k]], b = e[p[k + 1]];
          if (a && b) segs.push(a, b);
        }
      }
    }
    return segs;
  }

  /* ---------- 二次曲线识别 ---------- */
  function polyAdd(A, B, s) {
    s = s == null ? 1 : s;
    var o = Object.assign({}, A);
    Object.keys(B).forEach(function (k) { o[k] = (o[k] || 0) + s * B[k]; });
    return o;
  }
  function polyMul(A, B) {
    var o = {};
    Object.keys(A).forEach(function (ka) {
      var pa = ka.split(",").map(Number);
      Object.keys(B).forEach(function (kb) {
        var pb = kb.split(",").map(Number);
        var k = (pa[0] + pb[0]) + "," + (pa[1] + pb[1]);
        o[k] = (o[k] || 0) + A[ka] * B[kb];
      });
    });
    return o;
  }
  function polyPow(A, n) {
    if (n === 0) return { "0,0": 1 };
    var r = { "0,0": 1 };
    for (var i = 0; i < n; i++) r = polyMul(r, A);
    return r;
  }
  function polyDeg(A) {
    var d = 0;
    Object.keys(A).forEach(function (k) {
      if (Math.abs(A[k]) < 1e-14) return;
      var p = k.split(",").map(Number);
      d = Math.max(d, p[0] + p[1]);
    });
    return d;
  }

  function asPoly(node) {
    if (!node) return null;
    if (node.k === "eq") {
      var L = asPoly(node.a), R = asPoly(node.b);
      if (!L || !R) return null;
      return polyAdd(L, R, -1);
    }
    if (node.k === "num") return { "0,0": node.v };
    if (node.k === "var") {
      var n = node.n, low = n.toLowerCase();
      if (n === "x" || low === "x") return { "1,0": 1 };
      if (n === "y" || low === "y") return { "0,1": 1 };
      if (CONST[n] != null) return { "0,0": CONST[n] };
      if (CONST[low] != null) return { "0,0": CONST[low] };
      return null;
    }
    if (node.k === "un") {
      var u = asPoly(node.a); if (!u) return null;
      return node.op === "-" ? polyAdd({}, u, -1) : u;
    }
    if (node.k === "op") {
      var a = asPoly(node.a), b = asPoly(node.b);
      if (!a || !b) return null;
      if (node.op === "+") return polyAdd(a, b, 1);
      if (node.op === "-") return polyAdd(a, b, -1);
      if (node.op === "*") return polyMul(a, b);
      if (node.op === "/") {
        var keys = Object.keys(b).filter(function (k) { return Math.abs(b[k]) > 1e-14; });
        if (keys.length === 1 && keys[0] === "0,0" && Math.abs(b["0,0"]) > 1e-14) return polyAdd({}, a, 1 / b["0,0"]);
        return null;
      }
      if (node.op === "^") {
        var kk = Object.keys(b).filter(function (k) { return Math.abs(b[k]) > 1e-14; });
        if (kk.length === 1 && kk[0] === "0,0") {
          var e = b["0,0"];
          if (Math.abs(e - Math.round(e)) < 1e-10 && e >= 0 && e <= 8) return polyPow(a, Math.round(e));
        }
        return null;
      }
    }
    if (node.k === "call" && node.n === "abs") return null;
    return null;
  }

  function coefs(P) {
    function g(i, j) { return P[i + "," + j] || 0; }
    return { A: g(2, 0), B: g(1, 1), C: g(0, 2), D: g(1, 0), E: g(0, 1), F: g(0, 0) };
  }

  function classifyConic(P) {
    if (!P || polyDeg(P) > 2 || polyDeg(P) < 1) return null;
    var c = coefs(P);
    var A = c.A, B = c.B, C = c.C, D = c.D, E = c.E, F = c.F;
    if (Math.abs(A) + Math.abs(B) + Math.abs(C) < 1e-12) return null;
    var delta = B * B - 4 * A * C;
    var theta = 0, cth = 1, sth = 0;
    if (Math.abs(B) > 1e-10) {
      theta = 0.5 * Math.atan2(B, A - C);
      cth = Math.cos(theta); sth = Math.sin(theta);
    }
    var Ap = A * cth * cth + B * cth * sth + C * sth * sth;
    var Cp = A * sth * sth - B * cth * sth + C * cth * cth;
    var Dp = D * cth + E * sth;
    var Ep = -D * sth + E * cth;
    var Fp = F;
    var h = 0, k = 0;
    if (Math.abs(Ap) > 1e-12) { h = -Dp / (2 * Ap); Fp = Fp - Dp * Dp / (4 * Ap); Dp = 0; }
    if (Math.abs(Cp) > 1e-12) { k = -Ep / (2 * Cp); Fp = Fp - Ep * Ep / (4 * Cp); Ep = 0; }
    function rot(xp, yp) {
      return { x: cth * xp - sth * yp, y: sth * xp + cth * yp };
    }
    var info = { theta: theta, rotated: Math.abs(B) > 1e-10, A: A, B: B, C: C, D: D, E: E, F: F };

    if (Math.abs(delta) < 1e-8) {
      if (Math.abs(Ap) < 1e-10 && Math.abs(Cp) > 1e-10 && Math.abs(Dp) > 1e-10) {
        h = -Fp / Dp; Fp = 0;
        var p = -Dp / (2 * Cp);
        if (Math.abs(p) < 1e-12) return null;
        var cxky0 = rot(h, k);
        info.type = "parabola";
        info.axis = "x";
        info.p = p;
        info.vertex = cxky0;
        info.center = cxky0;
        info.focus = rot(h + p / 2, k);
        var d1p = rot(h - p / 2, k), d2p = rot(h - p / 2, k + 1);
        info.directrix = [d1p, { x: d2p.x - d1p.x, y: d2p.y - d1p.y }];
        return info;
      }
      if (Math.abs(Cp) < 1e-10 && Math.abs(Ap) > 1e-10 && Math.abs(Ep) > 1e-10) {
        k = -Fp / Ep; Fp = 0;
        var p2 = -Ep / (2 * Ap);
        if (Math.abs(p2) < 1e-12) return null;
        var cxky1 = rot(h, k);
        info.type = "parabola";
        info.axis = "y";
        info.p = p2;
        info.vertex = cxky1;
        info.center = cxky1;
        info.focus = rot(h, k + p2 / 2);
        var e1 = rot(h, k - p2 / 2), e2 = rot(h + 1, k - p2 / 2);
        info.directrix = [e1, { x: e2.x - e1.x, y: e2.y - e1.y }];
        return info;
      }
      return info;
    }
    var cxky = rot(h, k);
    info.center = cxky;

    if (Math.abs(Fp) < 1e-14) {
      info.type = "degenerate";
      return info;
    }
    var rhs = -Fp;
    var Aa = Ap / rhs, Cc = Cp / rhs;
    if (delta < 0) {
      if (Aa * Cc <= 0 || Aa <= 0) { info.type = "empty"; return info; }
      var a2 = 1 / Aa, b2 = 1 / Cc;
      var a = Math.sqrt(a2), b = Math.sqrt(b2);
      if (Math.abs(a - b) < 1e-8 * Math.max(a, b, 1)) {
        info.type = "circle";
        info.r = a;
        info.a = a; info.b = b;
        return info;
      }
      info.type = "ellipse";
      info.a = a; info.b = b;
      var horiz = a >= b;
      var aa = Math.max(a, b), bb = Math.min(a, b);
      var cc = Math.sqrt(Math.max(0, aa * aa - bb * bb));
      info.c = cc; info.e = aa > 0 ? cc / aa : 0;
      if (horiz) {
        info.foci = [rot(h - cc, k), rot(h + cc, k)];
        if (info.e > 1e-10) {
          var ae = aa / info.e;
          info.directrices = [
            [rot(h - ae, k), rot(0, 1)],
            [rot(h + ae, k), rot(0, 1)]
          ];
        }
      } else {
        info.foci = [rot(h, k - cc), rot(h, k + cc)];
        if (info.e > 1e-10) {
          var ae2 = aa / info.e;
          info.directrices = [
            [rot(h, k - ae2), rot(1, 0)],
            [rot(h, k + ae2), rot(1, 0)]
          ];
        }
      }
      return info;
    }
    if (Aa * Cc < 0 || (Aa < 0 && Cc < 0)) {
      if (Aa < 0 && Cc < 0) { info.type = "empty"; return info; }
      var horizH = Aa > 0;
      var aH, bH;
      if (horizH) { aH = Math.sqrt(1 / Aa); bH = Math.sqrt(-1 / Cc); }
      else { aH = Math.sqrt(1 / Cc); bH = Math.sqrt(-1 / Aa); }
      info.type = "hyperbola";
      info.a = aH; info.b = bH;
      info.c = Math.sqrt(aH * aH + bH * bH);
      info.e = info.c / aH;
      if (horizH) {
        info.foci = [rot(h - info.c, k), rot(h + info.c, k)];
        info.asymptotes = [
          [cxky, rot(cth * 1 - sth * (bH / aH), sth * 1 + cth * (bH / aH))],
          [cxky, rot(cth * 1 - sth * (-bH / aH), sth * 1 + cth * (-bH / aH))]
        ];
        info.open = "x";
        if (info.e > 1e-10) {
          var ah = aH / info.e;
          info.directrices = [[rot(h - ah, k), rot(0, 1)], [rot(h + ah, k), rot(0, 1)]];
        }
      } else {
        info.foci = [rot(h, k - info.c), rot(h, k + info.c)];
        info.asymptotes = [
          [cxky, rot(cth * (bH / aH) - sth * 1, sth * (bH / aH) + cth * 1)],
          [cxky, rot(cth * (-bH / aH) - sth * 1, sth * (-bH / aH) + cth * 1)]
        ];
        info.open = "y";
        if (info.e > 1e-10) {
          var ah2 = aH / info.e;
          info.directrices = [[rot(h, k - ah2), rot(1, 0)], [rot(h, k + ah2), rot(1, 0)]];
        }
      }
      return info;
    }
    info.type = "degenerate";
    return info;
  }

  function analyzeConic(node) {
    var P = asPoly(node);
    if (!P) return null;
    return classifyConic(P);
  }

  /* ---------- 点线辅助（准线为点+方向） ---------- */
  function linePoints(pt, dir, span) {
    var L = Math.hypot(dir.x, dir.y) || 1;
    var ux = dir.x / L, uy = dir.y / L;
    span = span || 100;
    return [{ x: pt.x - ux * span, y: pt.y - uy * span }, { x: pt.x + ux * span, y: pt.y + uy * span }];
  }

  /* ---------- LaTeX ---------- */
  function precOf(node) {
    if (!node) return 100;
    if (node.k === "num" || node.k === "var" || node.k === "call") return 100;
    if (node.k === "un") return 7;
    if (node.k === "op") {
      var o = node.op;
      if (o === "^") return 8;
      if (o === "*" || o === "/") return 6;
      if (o === "+" || o === "-") return 5;
      if (o === "<" || o === ">" || o === "<=" || o === ">=" || o === "==" || o === "!=") return 4;
      if (o === "&&") return 3;
      if (o === "||") return 2;
    }
    if (node.k === "tern") return 1;
    if (node.k === "eq") return 0;
    return 100;
  }
  function wrap(s, need) { return need ? "\\left(" + s + "\\right)" : s; }
  function latexVar(n) {
    var map = { π: "\\pi", θ: "\\theta", τ: "\\tau", φ: "\\varphi", ω: "\\omega", α: "\\alpha", β: "\\beta", γ: "\\gamma", phi: "\\varphi", omega: "\\omega", theta: "\\theta" };
    if (map[n]) return map[n];
    if (n.length === 1) return n;
    return "\\mathrm{" + n + "}";
  }
  function latexNum(v) {
    if (Math.abs(v - PI) < 1e-12) return "\\pi";
    if (Math.abs(v + PI) < 1e-12) return "-\\pi";
    if (Math.abs(v - E) < 1e-12) return "e";
    if (Math.abs(v) < 1e-12) return "0";
    if (Math.abs(v - Math.round(v)) < 1e-12) return String(Math.round(v));
    var s = String(+v.toPrecision(12));
    return s;
  }
  function toLatex(node, parentPrec) {
    if (!node) return "";
    var p = precOf(node);
    var s;
    if (node.k === "num") s = latexNum(node.v);
    else if (node.k === "var") s = latexVar(node.n);
    else if (node.k === "un") s = (node.op === "-" ? "-" : "") + toLatex(node.a, 7);
    else if (node.k === "eq") s = toLatex(node.a, 0) + "=" + toLatex(node.b, 0);
    else if (node.k === "tern") s = toLatex(node.c, 1) + "\\, ?\\, " + toLatex(node.a, 1) + "\\, :\\, " + toLatex(node.b, 1);
    else if (node.k === "piece") {
      s = "\\begin{cases}" + node.parts.map(function (p) {
        return toLatex(p.expr, 0) + "&" + (p.cond ? toLatex(p.cond, 0) : "\\text{其他}");
      }).join("\\\\") + "\\end{cases}";
      p = 100;
    }
    else if (node.k === "op" && node.op === "/") {
      s = "\\dfrac{" + toLatex(node.a, 0) + "}{" + toLatex(node.b, 0) + "}";
      p = 100;
    } else if (node.k === "op" && node.op === "^") {
      s = toLatex(node.a, 9) + "^{" + toLatex(node.b, 0) + "}";
    } else if (node.k === "op" && node.op === "*") {
      var hide = (node.a.k === "num" || node.a.k === "var" || node.a.k === "call" || (node.a.k === "op" && node.a.op === "^")) &&
        (node.b.k === "var" || node.b.k === "call" || node.b.k === "num" || (node.b.k === "op" && (node.b.op === "^" || node.b.op === "/")));
      if (node.b.k === "num") hide = false;
      s = toLatex(node.a, 6) + (hide ? "" : "\\cdot ") + toLatex(node.b, 6);
    } else if (node.k === "op") {
      var opm = { "+": "+", "-": "-", "<": "<", ">": ">", "<=": "\\le ", ">=": "\\ge ", "==": "=", "!=": "\\ne ", "&&": "\\land ", "||": "\\lor " };
      s = toLatex(node.a, p) + (opm[node.op] || node.op) + toLatex(node.b, p);
    } else if (node.k === "call") {
      var fnMap = { sin: "\\sin", cos: "\\cos", tan: "\\tan", ln: "\\ln", log: "\\log", lg: "\\lg", log10: "\\lg", log2: "\\log_{2}", lb: "\\lb", exp: "\\exp", abs: null, sqrt: null, asin: "\\arcsin", acos: "\\arccos", atan: "\\arctan", arcsin: "\\arcsin", arccos: "\\arccos", arctan: "\\arctan", sinh: "\\sinh", cosh: "\\cosh", tanh: "\\tanh", sec: "\\sec", csc: "\\csc", cot: "\\cot", min: "\\min", max: "\\max" };
      if (node.n === "sqrt" && node.args.length === 1) s = "\\sqrt{" + toLatex(node.args[0], 0) + "}";
      else if (node.n === "abs" && node.args.length === 1) s = "\\left|" + toLatex(node.args[0], 0) + "\\right|";
      else if (node.n === "log" && node.args.length === 2) s = "\\log_{" + toLatex(node.args[0], 0) + "}{" + toLatex(node.args[1], 0) + "}";
      else {
        var head = fnMap[node.n] || "\\operatorname{" + node.n + "}";
        s = head + "\\left(" + node.args.map(function (a) { return toLatex(a, 0); }).join(",") + "\\right)";
      }
    } else s = "";
    return wrap(s, parentPrec > p);
  }

  function latexOf(src) {
    try { return toLatex(parse(src), -1); } catch (e) { return null; }
  }

  /* ---------- 格式化 ---------- */
  function almost(a, b, t) { return Math.abs(a - b) <= (t || 1e-8) * (1 + Math.abs(b)); }

  function formatNum(v, prec) {
    if (!finite(v)) return "—";
    if (almost(v, 0, 1e-10)) return "0";
    var P = [1, 2, 3, 4, 5, 6, 8, 12];
    for (var i = 0; i < P.length; i++) {
      var d = P[i];
      for (var k = -24; k <= 24; k++) {
        if (k === 0) continue;
        if (almost(v, k * PI / d, 1e-8)) {
          return formatPi(k, d);
        }
      }
    }
    if (almost(v, Math.round(v), 1e-10) && Math.abs(v) < 1e12) return String(Math.round(v));
    if (almost(v, E, 1e-8)) return "e";
    if (almost(v, -E, 1e-8)) return "-e";
    for (var n = 2; n <= 200; n++) {
      var s = Math.sqrt(n);
      if (s === Math.round(s)) continue;
      if (almost(v, s, 1e-8)) return "√" + n;
      if (almost(v, -s, 1e-8)) return "-√" + n;
    }
    for (var den = 2; den <= 16; den++) {
      var num = Math.round(v * den);
      if (almost(v, num / den, 1e-8) && Math.abs(num) <= 64) {
        var g = gcd(Math.abs(num), den);
        num /= g; den /= g;
        if (den === 1) return String(num);
        return (num < 0 ? "-" : "") + Math.abs(num) + "/" + den;
      }
    }
    var z = +v.toPrecision(prec || 6);
    var t = String(z);
    if (t.indexOf("e") >= 0) return z.toExponential(5).replace(/e\+?/, "×10^");
    return t;
  }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function formatPi(k, d) {
    var g = gcd(Math.abs(k), d);
    k /= g; d /= g;
    var sign = k < 0 ? "-" : "";
    k = Math.abs(k);
    if (d === 1) return sign + (k === 1 ? "π" : k + "π");
    if (k === 1) return sign + "π/" + d;
    return sign + k + "π/" + d;
  }

  function niceStep(span, target) {
    target = target || 8;
    if (!(span > 0)) return 1;
    var raw = span / target;
    var exp = Math.pow(10, Math.floor(Math.log10(raw)));
    var n = raw / exp;
    var step = n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10;
    return step * exp;
  }

  function piStep(span, target) {
    target = target || 8;
    var cands = [PI / 12, PI / 6, PI / 4, PI / 3, PI / 2, PI, 2 * PI, 4 * PI];
    var best = cands[0], score = Infinity;
    for (var i = 0; i < cands.length; i++) {
      var ticks = span / cands[i];
      var sc = Math.abs(ticks - target) + (ticks < 3 ? 8 : 0) + (ticks > 16 ? (ticks - 16) : 0);
      if (sc < score) { score = sc; best = cands[i]; }
    }
    return best;
  }

  function detectKind(src) {
    var s = String(src).trim();
    if (!s) return { kind: "empty" };
    try {
      if (/^\s*r\s*=/i.test(s) || /[θ]|theta/i.test(s) && !/y\s*=/i.test(s) && !/\bx\s*=/.test(s)) {
        var body = s.replace(/^\s*r\s*=/i, "");
        var node = parse(body);
        if (usesVar(node, "θ") || usesVar(node, "theta") || usesVar(node, "t")) return { kind: "polar", node: node, raw: body };
      }
      var xm = s.match(/^\s*x\s*=\s*([^,;]+)[,;]\s*y\s*=\s*(.+)$/i);
      var ym = s.match(/^\s*y\s*=\s*([^,;]+)[,;]\s*x\s*=\s*(.+)$/i);
      if (xm) {
        return { kind: "param", x: parse(xm[1]), y: parse(xm[2]), rawx: xm[1].trim(), rawy: xm[2].trim() };
      }
      if (ym) {
        return { kind: "param", x: parse(ym[2]), y: parse(ym[1]), rawx: ym[2].trim(), rawy: ym[1].trim() };
      }
      var body2 = s.replace(/^\s*y\s*=\s*/i, "");
      var node2 = parse(body2);
      if (node2.k === "op" && /^(<|>|<=|>=)$/.test(node2.op)) {
        function isY(n) { return n && n.k === "var" && n.n === "y"; }
        var flip = { "<": ">", ">": "<", "<=": ">=", ">=": "<=" };
        if (isY(node2.a) && !usesVar(node2.b, "y")) return { kind: "ineq", style: "y", op: node2.op, rhs: node2.b, node: node2, raw: s };
        if (isY(node2.b) && !usesVar(node2.a, "y")) return { kind: "ineq", style: "y", op: flip[node2.op], rhs: node2.a, node: node2, raw: s };
        return { kind: "ineq", style: "F", op: node2.op, node: node2, raw: s };
      }
      if (node2.k === "eq" || (usesVar(node2, "y") && usesVar(node2, "x"))) {
        return { kind: "implicit", node: node2, raw: s };
      }
      return { kind: "explicit", node: node2, raw: body2 };
    } catch (e) {
      return { kind: "error", error: e.message };
    }
  }

  function splitInput(s) {
    s = String(s).trim();
    return s;
  }


  /* ---------- 单侧导数与不可导点 ---------- */
  function d1side(fn, x, dir) {
    var h0 = 1e-5 * (1 + Math.abs(x)), vals = [], hs = [h0, 4 * h0, 16 * h0];
    var y0 = fn(x);
    if (!finite(y0)) return NaN;
    for (var i = 0; i < hs.length; i++) {
      var y1 = fn(x + dir * hs[i]);
      if (finite(y1)) vals.push((y1 - y0) / (dir * hs[i]));
    }
    if (!vals.length) return NaN;
    var a = vals[0], b = vals[Math.min(1, vals.length - 1)];
    if (finite(a) && finite(b) && Math.abs(a - b) > 0.35 * (1 + Math.abs(a) + Math.abs(b))) {
      if (Math.abs(a) > 50 && Math.abs(b) > 50 && a * b > 0) return a > 0 ? Infinity : -Infinity;
    }
    if (vals.length >= 2 && finite(vals[0]) && finite(vals[1]) &&
        Math.abs(vals[0] - vals[1]) < 0.35 * (1 + Math.abs(vals[0]) + Math.abs(vals[1]))) {
      var ext = (4 * vals[0] - vals[1]) / 3;
      if (finite(ext)) return ext;
    }
    return a;
  }
  function derivAt(fn, x) {
    var L = d1side(fn, x, -1), R = d1side(fn, x, 1);
    var mid = d1(fn, x);
    var both = finite(L) && finite(R);
    var vert = (finite(L) && Math.abs(L) > 80) || (finite(R) && Math.abs(R) > 80) || L === INF || R === INF || L === -INF || R === -INF;
    var smooth = both && Math.abs(L - R) <= 0.08 * (1 + Math.abs(L) + Math.abs(R)) + 0.08;
    if (smooth && !vert) return { k: finite(mid) ? mid : (L + R) / 2, left: L, right: R, smooth: true, vertical: false };
    if (vert && both && L * R > 0) return { k: NaN, left: L, right: R, smooth: false, vertical: true };
    if (vert && !both && (Math.abs(L) > 80 || Math.abs(R) > 80 || !isFinite(L) || !isFinite(R))) {
      return { k: NaN, left: L, right: R, smooth: false, vertical: true, half: !both };
    }
    return { k: NaN, left: L, right: R, smooth: false, vertical: false };
  }
  function findCusps(fn, xmin, xmax, n) {
    n = n || 280;
    var out = [], dx = (xmax - xmin) / n;
    function consider(x) {
      if (x < xmin - 1e-12 || x > xmax + 1e-12) return;
      if (!finite(fn(x))) return;
      if (!derivAt(fn, x).smooth) out.push(x);
    }
    consider(0);
    for (var i = 0; i <= n; i++) consider(xmin + dx * i);
    for (var i = 0; i < n; i++) {
      var x1 = xmin + dx * i, x2 = x1 + dx;
      var s1 = d1(fn, x1), s2 = d1(fn, x2);
      if (!finite(s1) || !finite(s2) || !finite(fn(x1)) || !finite(fn(x2))) continue;
      if (Math.abs(s1 - s2) > 0.45 * (1 + Math.abs(s1) + Math.abs(s2))) {
        var a = x1, b = x2;
        for (var k = 0; k < 22; k++) {
          var m = (a + b) / 2;
          if (!derivAt(fn, m).smooth) { out.push(m); break; }
          var sm = d1(fn, m);
          if (!finite(sm)) { consider(m); break; }
          if (Math.abs(sm - s1) > Math.abs(sm - s2)) b = m; else a = m;
        }
        consider((x1 + x2) / 2);
      }
    }
    var sp = xmax - xmin;
    return uniqueSorted(out, sp * 3e-3).map(function (x) { return snapNice(x, sp); });
  }

  /* ---------- 定积分 ---------- */
  function integrate(fn, a, b, n) {
    if (!finite(a) || !finite(b) || a === b) return { value: 0, abs: 0, ok: true };
    var sign = 1;
    if (b < a) { var t = a; a = b; b = t; sign = -1; }
    n = n || 480;
    if (n % 2) n++;
    var h = (b - a) / n;
    var sum = 0, abss = 0, miss = 0;
    function fy(x) { var y = fn(x); return finite(y) ? y : null; }
    var y0 = fy(a), yn = fy(b);
    if (y0 == null || yn == null) miss++;
    var acc = (y0 || 0) + (yn || 0);
    for (var i = 1; i < n; i++) {
      var y = fy(a + i * h);
      if (y == null) { miss++; y = 0; }
      acc += y * (i % 2 ? 4 : 2);
      abss += Math.abs(y) * (i % 2 ? 4 : 2);
    }
    abss += Math.abs(y0 || 0) + Math.abs(yn || 0);
    var val = acc * h / 3;
    return { value: sign * val, abs: abss * h / 3, ok: miss < n * 0.05 };
  }

  /* ---------- 函数性质 ---------- */
  function domainHints(node) {
    var hints = [], seen = Object.create(null);
    function add(s) { if (!seen[s]) { seen[s] = 1; hints.push(s); } }
    if (!node) return hints;
    walk(node, function (n) {
      if (n.k === "call") {
        if (n.n === "sqrt") add("根号内 ≥ 0");
        if (n.n === "ln" || n.n === "log" || n.n === "lg" || n.n === "log10" || n.n === "lb" || n.n === "log2") add("真数 > 0");
        if (n.n === "tan" || n.n === "sec") add("x ≠ π/2+kπ");
        if (n.n === "cot" || n.n === "csc") add("x ≠ kπ");
        if (n.n === "asin" || n.n === "acos" || n.n === "arcsin" || n.n === "arccos") add("反三角自变量在 [-1, 1]");
      }
      if (n.k === "op" && n.op === "/") add("分母 ≠ 0");
    });
    return hints;
  }
  function domainIntervals(fn, xmin, xmax, n) {
    n = n || 500;
    var dx = (xmax - xmin) / n, segs = [], a = null;
    for (var i = 0; i <= n; i++) {
      var x = xmin + dx * i, ok = finite(fn(x));
      if (ok && a == null) a = x;
      if (!ok && a != null) { segs.push([a, xmin + dx * (i - 1)]); a = null; }
    }
    if (a != null) segs.push([a, xmax]);
    return segs;
  }
  function parityOf(fn, R) {
    R = R || 4;
    var even = 0, odd = 0, tot = 0;
    for (var i = 1; i <= 28; i++) {
      var x = (i / 28) * R, a = fn(x), b = fn(-x);
      if (!finite(a) || !finite(b)) continue;
      tot++;
      if (almost(a, b, 1e-5)) even++;
      if (almost(a, -b, 1e-5)) odd++;
    }
    if (tot < 8) return "难以判断";
    if (even / tot > 0.9 && odd / tot > 0.9) return "既奇又偶";
    if (even / tot > 0.9) return "偶函数";
    if (odd / tot > 0.9) return "奇函数";
    return "非奇非偶";
  }
  function periodOf(fn, node) {
    var cands = [2 * PI, PI, PI / 2, PI / 3, 2 * PI / 3, 4 * PI, 6, 4, 2, 1];
    function ok(T) {
      if (!(T > 1e-8) || T > 40) return false;
      var hit = 0, tot = 0;
      for (var i = 0; i < 24; i++) {
        var x = -3.2 + i * 0.37, a = fn(x), b = fn(x + T);
        if (!finite(a) && !finite(b)) continue;
        tot++;
        if (finite(a) && finite(b) && almost(a, b, 1e-4)) hit++;
      }
      return tot >= 10 && hit / tot > 0.9;
    }
    cands.sort(function (a, b) { return a - b; });
    for (var i = 0; i < cands.length; i++) if (ok(cands[i])) return cands[i];
    return null;
  }
  function monoIntervals(fn, xmin, xmax) {
    var xs = findExtrema(fn, xmin, xmax, Math.max(4, xmax - xmin), 700).map(function (p) { return p.x; });
    xs.push(xmin, xmax);
    xs = uniqueSorted(xs, (xmax - xmin) * 1e-5);
    var out = [];
    for (var i = 0; i < xs.length - 1; i++) {
      var a = xs[i], b = xs[i + 1], m = (a + b) / 2;
      var ya = fn(a), yb = fn(b), k = d1(fn, m);
      if (!finite(ya) || !finite(yb)) continue;
      var dir = almost(ya, yb, 1e-6) ? "常" : (yb > ya ? "增" : "减");
      if (!finite(k) && dir !== "常") dir = yb > ya ? "增" : "减";
      if (out.length && out[out.length - 1].dir === dir) out[out.length - 1].b = b;
      else out.push({ a: a, b: b, dir: dir });
    }
    return out;
  }
  function analyzeProps(fn, node, xmin, xmax) {
    var segs = domainIntervals(fn, xmin, xmax, 600);
    var hints = domainHints(node);
    var par = parityOf(fn, Math.min(6, Math.max(2, Math.abs(xmax), Math.abs(xmin))));
    var per = periodOf(fn, node);
    var mono = monoIntervals(fn, xmin, xmax);
    return { segs: segs, hints: hints, parity: par, period: per, mono: mono };
  }
  function valueTable(fn, xs) {
    return (xs || []).map(function (x) { return { x: x, y: fn(x) }; });
  }

  var API = {
    parse: parse,
    compile: compile,
    eval: evalNode,
    paramsOf: paramsOf,
    usesVar: usesVar,
    sampleFn: sampleFn,
    isBreak: isBreak,
    findZeros: findZeros,
    findExtrema: findExtrema,
    findIntersections: findIntersections,
    d1: d1,
    d2: d2,
    sampleImplicit: sampleImplicit,
    analyzeConic: analyzeConic,
    asPoly: asPoly,
    linePoints: linePoints,
    toLatex: toLatex,
    latexOf: latexOf,
    formatNum: formatNum,
    niceStep: niceStep,
    piStep: piStep,
    detectKind: detectKind,
    splitInput: splitInput,
    CONST: CONST,
    FNS: FNS,
    finite: finite,
    uniqueSorted: uniqueSorted,
    derivAt: derivAt,
    d1side: d1side,
    findCusps: findCusps,
    integrate: integrate,
    analyzeProps: analyzeProps,
    domainHints: domainHints,
    valueTable: valueTable,
    isCond: isCond
  };

  root.SX = API;
  if (typeof module !== "undefined") module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
