/* 数形 · 函数画板 */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var COLORS = ["var(--c0)", "var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)", "var(--c6)"];
  var COLOR_HEX_L = ["#245a8c", "#c44b32", "#2a8a74", "#b07a20", "#6b5aa8", "#3d6b8a", "#a85a4a"];
  var COLOR_HEX_D = ["#7eb4e0", "#e07a5f", "#5ec4ae", "#e0b15a", "#a898e0", "#7aa0b8", "#d08a7a"];
  var STORE = "shuxing.v1";
  var EYEO = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/></svg>';
  var EYEX = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 5l18 14M9.5 9.7A4 4 0 0 0 8 12c0 2.2 1.8 4 4 4a4 4 0 0 0 2.3-.7"/><path d="M4 8.2C6.2 6.1 8.9 5 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.2 4.1"/></svg>';
  var PI = Math.PI;

  var PAL_DEF = {
    a: { v: 1, min: -5, max: 5 }, A: { v: 1, min: -5, max: 5 },
    b: { v: 1, min: -5, max: 5 }, k: { v: 1, min: -5, max: 5 },
    c: { v: 0, min: -6, max: 6 }, h: { v: 0, min: -8, max: 8 },
    w: { v: 1, min: -6, max: 6 }, "ω": { v: 1, min: -6, max: 6 },
    phi: { v: 0, min: -6.3, max: 6.3 }, "φ": { v: 0, min: -6.3, max: 6.3 },
    n: { v: 2, min: -6, max: 6 }, p: { v: 2, min: -8, max: 8 },
    m: { v: 1, min: -5, max: 5 }, r: { v: 2, min: 0.2, max: 8 },
    d: { v: 1, min: -5, max: 5 }
  };

  var PRESETS = [
    { g: "基本初等函数", items: [
      { n: "一次函数", e: "k*x+b", d: "斜率 k 决定倾斜程度，b 是纵截距。", p: { k: 1, b: 0 } },
      { n: "二次函数", e: "a*(x-h)^2+k", d: "顶点在 (h, k)，a 的正负决定开口方向。", p: { a: 1, h: 0, k: 0 } },
      { n: "反比例函数", e: "k/x", d: "双曲线，两支分居一、三或二、四象限。", p: { k: 1 } },
      { n: "对勾函数", e: "x+1/x", d: "x>0 时在 x=1 取最小值 2，常用于基本不等式。", v: [-6, 6] },
      { n: "幂函数", e: "x^n", d: "形态随指数 n 的奇偶与正负而变化。", p: { n: 2 }, v: [-4, 4] },
      { n: "指数函数", e: "a^x", d: "恒过定点 (0, 1)。a>1 递增，0<a<1 递减。", p: { a: 2 }, v: [-4, 4] },
      { n: "对数函数", e: "log(a,x)", d: "与 y=a^x 互为反函数，恒过定点 (1, 0)。", p: { a: 2 }, v: [-2, 8] },
      { n: "指数与对数", multi: ["a^x", "log(a,x)", "x"], d: "二者关于直线 y=x 对称。", p: { a: 2 }, v: [-4, 6] }
    ]},
    { g: "三角函数与变换", items: [
      { n: "正弦变换", e: "A*sin(w*x+phi)", d: "A 控制振幅，w 控制周期，phi 为初相。", p: { A: 2, w: 1, phi: 0 }, v: [-2 * PI, 2 * PI], pi: true },
      { n: "余弦变换", e: "A*cos(w*x+phi)", d: "可由正弦水平平移得到。", p: { A: 1, w: 1, phi: 0 }, v: [-2 * PI, 2 * PI], pi: true },
      { n: "正切函数", e: "tan(x)", d: "周期为 π，在 x=π/2+kπ 处有垂直渐近线。", v: [-2 * PI, 2 * PI], pi: true },
      { n: "正弦伸缩对比", multi: ["sin(x)", "2*sin(x)", "sin(2x)"], d: "系数 2 把振幅拉高，2x 把周期缩短为原来的一半。", v: [-2 * PI, 2 * PI], pi: true },
      { n: "相位移动", multi: ["sin(x)", "sin(x+pi/3)", "sin(x)+pi/3"], d: "加在自变量上是水平平移，加在函数值上是竖直平移。", v: [-2 * PI, 2 * PI], pi: true }
    ]},
    { g: "分段与其他", items: [
      { n: "绝对值", e: "abs(x)", d: "在原点处不可导，图像是一条折线。", v: [-6, 6] },
      { n: "分段函数", e: "{x^2, x<0; 2x, x>=0}", d: "课本写法：大括号里写「解析式，条件」，各段用分号隔开。", v: [-4, 4], deriv: true },
      { n: "单位圆盘", e: "x^2+y^2<1", d: "不等式围出的区域会以浅色标出，并画出边界。", aspect: true },
      { n: "抛物线上方", e: "y>x^2", d: "把满足 y>x² 的平面区域涂上浅色。", v: [-4, 4] },
      { n: "绝对值求和", e: "abs(x-2)+abs(x+1)", d: "图像是折线，最低段对应各零点之间的区间。", v: [-6, 6] },
      { n: "三次函数", e: "x^3-3x", d: "在 x=±1 处取极值，适合观察导数与切线。", v: [-4, 4], deriv: true },
      { n: "根式函数", e: "sqrt(x)", d: "定义域 x≥0，过原点且在原点处切线竖直。", v: [-2, 8] }
    ]},
    { g: "圆锥曲线", items: [
      { n: "圆", e: "x^2+y^2=r^2", d: "圆心在原点，半径由滑块 r 调节。", p: { r: 3 }, k: "implicit", aspect: true },
      { n: "椭圆", e: "x^2/a^2+y^2/b^2=1", d: "焦点在长轴上，c=√|a²-b²|，离心率 e=c/a。", p: { a: 4, b: 3 }, k: "implicit", aspect: true },
      { n: "双曲线", e: "x^2/a^2-y^2/b^2=1", d: "开口向左右，渐近线为 y=±(b/a)x。", p: { a: 2, b: 3 }, k: "implicit", aspect: true },
      { n: "上下开口双曲线", e: "y^2/a^2-x^2/b^2=1", d: "开口向上下，渐近线同样是 y=±(a/b)x。", p: { a: 2, b: 3 }, k: "implicit", aspect: true },
      { n: "抛物线", e: "y^2=2*p*x", d: "焦点为 (p/2, 0)，准线为 x=-p/2（人教版记法）。", p: { p: 2 }, k: "implicit", aspect: true },
      { n: "竖向抛物线", e: "x^2=2*p*y", d: "开口向上或向下，焦点在对称轴上。", p: { p: 2 }, k: "implicit", aspect: true },
      { n: "平移椭圆", e: "(x-h)^2/a^2+(y-k)^2/b^2=1", d: "中心移到 (h, k)，其余性质与标准椭圆相同。", p: { a: 3, b: 2, h: 1, k: -1 }, k: "implicit", aspect: true }
    ]},
    { g: "参数与极坐标", items: [
      { n: "单位圆", x: "cos(t)", y: "sin(t)", d: "参数方程的圆，t 从 0 到 2π 走一圈。", k: "param", t: [0, 2 * PI], aspect: true },
      { n: "参数椭圆", x: "a*cos(t)", y: "b*sin(t)", d: "与椭圆标准方程表示同一曲线。", k: "param", p: { a: 4, b: 3 }, t: [0, 2 * PI], aspect: true },
      { n: "过原点的圆", e: "2*a*cos(θ)", d: "极坐标 r=2a cosθ，圆心在 (a, 0)。", k: "polar", p: { a: 2 }, aspect: true },
      { n: "阿基米德螺线", e: "a*θ", d: "半径随角度均匀增大。", k: "polar", p: { a: 0.4 }, tr: [0, 6 * PI] }
    ]}
  ];

  var S = {
    mode: "explicit",
    exprs: [],
    sel: 0,
    view: { xmin: -8, xmax: 8, ymin: -4.5, ymax: 4.5 },
    aspect: false,
    pi: false,
    grid: true,
    marks: true,
    deriv: false,
    integ: false,
    intA: 0,
    intB: 1,
    tanX: 1,
    theme: "light",
    trace: null,
    dragging: null
  };

  var cv = $("#cv"), ctx = cv.getContext("2d");
  var W = 0, H = 0, dpr = 1;
  var cssColorCache = {};
  var anims = {};
  var toastT = 0;

  function hexColor(i) {
    return (S.theme === "dark" ? COLOR_HEX_D : COLOR_HEX_L)[i % 7];
  }
  function uid() { return Math.random().toString(36).slice(2, 9); }

  function reservedFor(kind) {
    var r = { e: 1, pi: 1, "π": 1, tau: 1, "τ": 1 };
    if (kind === "explicit") { r.x = 1; }
    else if (kind === "implicit") { r.x = 1; r.y = 1; }
    else if (kind === "param") { r.t = 1; r.x = 1; r.y = 1; }
    else if (kind === "polar") { r.θ = 1; r.theta = 1; r.t = 1; r.r = 1; }
    return r;
  }

  function defaultParam(name, preset) {
    if (preset && preset[name] != null) return { v: +preset[name], min: PAL_DEF[name] ? PAL_DEF[name].min : -5, max: PAL_DEF[name] ? PAL_DEF[name].max : 5 };
    var d = PAL_DEF[name] || { v: 1, min: -5, max: 5 };
    return { v: d.v, min: d.min, max: d.max };
  }

  function compileExpr(item, presetP) {
    item.error = "";
    item.fn = null; item.Fx = null; item.xt = null; item.yt = null; item.conic = null; item.holds = null; item.ineqOp = null;
    try {
      if (item.kind === "param") {
        item.nodeX = SX.parse(item.srcx);
        item.nodeY = SX.parse(item.srcy);
        var names = SX.paramsOf(item.nodeX, reservedFor("param")).concat(SX.paramsOf(item.nodeY, reservedFor("param")));
        item.params = mergeParams(item.params, unique(names), presetP);
        item.xt = function (t) { return SX.eval(item.nodeX, Object.assign({ t: t }, paramVals(item))); };
        item.yt = function (t) { return SX.eval(item.nodeY, Object.assign({ t: t }, paramVals(item))); };
      } else if (item.kind === "polar") {
        var body = String(item.src).replace(/^\s*r\s*=\s*/i, "");
        item.node = SX.parse(body);
        item.params = mergeParams(item.params, SX.paramsOf(item.node, reservedFor("polar")), presetP);
        item.rt = function (th) { return SX.eval(item.node, Object.assign({ "θ": th, theta: th, t: th }, paramVals(item))); };
      } else if (item.kind === "implicit") {
        var d = SX.detectKind(item.src);
        if (d.kind === "error") throw new Error(d.error);
        var node = d.node || SX.parse(item.src);
        item.node = node;
        item.params = mergeParams(item.params, SX.paramsOf(node, reservedFor("implicit")), presetP);
        item.Fx = function (x, y) { return SX.eval(item.node, Object.assign({ x: x, y: y }, paramVals(item))); };
        try { item.conic = SX.analyzeConic(substParams(node, paramVals(item))); } catch (e) { item.conic = null; }
      } else {
        var raw = String(item.src).replace(/^\s*y\s*=\s*/i, "");
        var det = SX.detectKind(item.src);
        if (det.kind === "error") throw new Error(det.error);
        if (det.kind === "ineq") {
          item.kind = "ineq";
          item.node = det.node;
          item.ineqOp = det.op;
          item.ineqStyle = det.style;
          item.params = mergeParams(item.params, SX.paramsOf(det.node, reservedFor("implicit")), presetP);
          if (det.style === "y") {
            item.rhs = det.rhs;
            item.fn = function (x) { return SX.eval(item.rhs, Object.assign({ x: x }, paramVals(item))); };
          }
          item.holds = function (x, y) { return !!SX.eval(item.node, Object.assign({ x: x, y: y }, paramVals(item))); };
          item.Fx = function (x, y) {
            var n = item.node;
            return SX.eval(n.a, Object.assign({ x: x, y: y }, paramVals(item))) - SX.eval(n.b, Object.assign({ x: x, y: y }, paramVals(item)));
          };
          return item;
        }
        if (det.kind === "implicit" || det.kind === "param" || det.kind === "polar") {
          item.kind = det.kind;
          if (det.kind === "param") { item.srcx = det.rawx; item.srcy = det.rawy; }
          if (det.kind === "polar" || det.kind === "implicit") item.src = det.raw || raw;
          return compileExpr(item, presetP);
        }
        item.node = det.node || SX.parse(raw);
        item.params = mergeParams(item.params, SX.paramsOf(item.node, reservedFor("explicit")), presetP);
        item.fn = function (x) { return SX.eval(item.node, Object.assign({ x: x }, paramVals(item))); };
        item.src = det.raw || raw;
      }
    } catch (err) {
      item.error = err.message || "无法解析";
    }
    return item;
  }

  function substParams(node, vals) {
    function copy(n) {
      if (n.k === "var" && vals[n.n] != null) return { k: "num", v: +vals[n.n] };
      if (n.k === "op" || n.k === "eq") return { k: n.k, op: n.op, a: copy(n.a), b: copy(n.b) };
      if (n.k === "un") return { k: "un", op: n.op, a: copy(n.a) };
      if (n.k === "tern") return { k: "tern", c: copy(n.c), a: copy(n.a), b: copy(n.b) };
      if (n.k === "call") return { k: "call", n: n.n, args: n.args.map(copy) };
      if (n.k === "piece") return { k: "piece", parts: n.parts.map(function (p) { return { expr: copy(p.expr), cond: p.cond ? copy(p.cond) : null }; }) };
      return n;
    }
    return copy(node);
  }

  function unique(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function paramVals(item) {
    var o = {};
    Object.keys(item.params || {}).forEach(function (k) { o[k] = item.params[k].v; });
    return o;
  }
  function mergeParams(old, names, preset) {
    var o = {};
    names.forEach(function (n) {
      o[n] = old && old[n] ? old[n] : defaultParam(n, preset);
    });
    return o;
  }

  function addExpr(spec) {
    var item = {
      id: uid(),
      kind: spec.kind || "explicit",
      src: spec.src || spec.e || "",
      srcx: spec.srcx || spec.x || "",
      srcy: spec.srcy || spec.y || "",
      on: spec.on !== false,
      color: S.exprs.length % 7,
      params: {},
      trange: spec.trange || spec.t || null,
      prange: spec.prange || spec.tr || null
    };
    compileExpr(item, spec.p);
    if ((item.kind === "param" || item.kind === "polar") && !item.trange && !item.prange) {
      item.trange = guessTRange(item);
    }
    S.exprs.push(item);
    S.sel = S.exprs.length - 1;
    return item;
  }

  function guessTRange(item) {
    var src = (item.src || "") + " " + (item.srcx || "") + " " + (item.srcy || "");
    if (/sin|cos|tan|θ|theta|pi|π/i.test(src)) return [0, 2 * PI];
    return item.kind === "polar" ? [0, 2 * PI] : [-10, 10];
  }

  /* ---------- 视图与绘制 ---------- */
  function resize() {
    var r = cv.getBoundingClientRect();
    dpr = Math.min(2.5, window.devicePixelRatio || 1);
    cv.width = Math.max(1, Math.round(r.width * dpr));
    cv.height = Math.max(1, Math.round(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = r.width; H = r.height;
    if (S.aspect) applyAspect();
    draw();
  }
  function applyAspect() {
    if (!W || !H) return;
    var mid = (S.view.ymin + S.view.ymax) / 2;
    var half = (S.view.xmax - S.view.xmin) * H / W / 2;
    S.view.ymin = mid - half; S.view.ymax = mid + half;
  }
  function X(x) { return (x - S.view.xmin) / (S.view.xmax - S.view.xmin) * W; }
  function Y(y) { return (S.view.ymax - y) / (S.view.ymax - S.view.ymin) * H; }
  function Wx(sx) { return S.view.xmin + sx / W * (S.view.xmax - S.view.xmin); }
  function Wy(sy) { return S.view.ymax - sy / H * (S.view.ymax - S.view.ymin); }

  function css(name) {
    if (cssColorCache[name]) return cssColorCache[name];
    var el = document.createElement("div");
    el.style.color = name; document.body.appendChild(el);
    var v = getComputedStyle(el).color; document.body.removeChild(el);
    cssColorCache[name] = v; return v;
  }
  function themeColors() {
    cssColorCache = {};
    return {
      ink: css("var(--ink)"), ink2: css("var(--ink2)"), ink3: css("var(--ink3)"),
      grid: css("var(--grid)"), grid2: css("var(--grid2)"), axis: css("var(--axis)"),
      paper: css("var(--paper)"), zhu: css("var(--zhu)"), acc: css("var(--acc)")
    };
  }

  function draw() {
    if (!W) return;
    var C = themeColors();
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, W, H);
    if (S.grid) drawGrid(C);
    drawAxes(C);
    S.exprs.forEach(function (e, i) {
      if (!e.on || e.error) return;
      drawItem(e, hexColor(e.color), i === S.sel);
    });
    if (S.integ) drawIntegral();
    if (S.marks) drawMarks(C);
    if (S.deriv) drawTangent(C);
    if (S.trace) drawTrace(C);
    ctx.restore();
    updateHud();
  }

  function niceTicks(min, max, piMode, target) {
    var span = max - min, step, ticks = [];
    if (piMode) step = SX.piStep(span, target || 8);
    else step = SX.niceStep(span, target || 8);
    var start = Math.ceil((min - 1e-12) / step) * step;
    if (start < min - 1e-9) start += step;
    for (var v = start; v <= max + 1e-9; v += step) ticks.push(+v.toPrecision(12));
    return { step: step, ticks: ticks };
  }
  function formatTick(v, piMode) {
    if (piMode) return SX.formatNum(v);
    if (!SX.finite(v)) return "";
    if (Math.abs(v) < 1e-12) return "0";
    var r = Math.round(v);
    if (Math.abs(v - r) < 1e-8 * (1 + Math.abs(v))) return String(r);
    var s = (+v.toPrecision(6)).toString();
    return s;
  }

  function drawGrid(C) {
    var xt = niceTicks(S.view.xmin, S.view.xmax, S.pi, 8);
    var yt = niceTicks(S.view.ymin, S.view.ymax, false, 8);
    ctx.lineWidth = 1;
    ctx.strokeStyle = C.grid;
    ctx.beginPath();
    xt.ticks.forEach(function (x) { ctx.moveTo(X(x) + 0.5, 0); ctx.lineTo(X(x) + 0.5, H); });
    yt.ticks.forEach(function (y) { ctx.moveTo(0, Y(y) + 0.5); ctx.lineTo(W, Y(y) + 0.5); });
    ctx.stroke();
  }

  function drawAxes(C) {
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    var y0 = Y(0), x0 = X(0);
    if (y0 > 0 && y0 < H) { ctx.moveTo(0, y0); ctx.lineTo(W, y0); }
    if (x0 > 0 && x0 < H + W && x0 > -2 && x0 < W) { ctx.moveTo(x0, 0); ctx.lineTo(x0, H); }
    ctx.stroke();
    if (y0 > 0 && y0 < H) arrow(W - 1, y0, 0);
    if (x0 > 0 && x0 < W) arrow(x0, 1, 1);
    var xt = niceTicks(S.view.xmin, S.view.xmax, S.pi, 8);
    var yt = niceTicks(S.view.ymin, S.view.ymax, false, 8);
    ctx.fillStyle = C.ink2;
    ctx.font = "12px " + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    xt.ticks.forEach(function (x) {
      if (Math.abs(x) < xt.step * 1e-6) return;
      var px = X(x), py = Math.min(Math.max(Y(0), 8), H - 18);
      ctx.strokeStyle = C.axis; ctx.beginPath(); ctx.moveTo(px, py - 4); ctx.lineTo(px, py + 4); ctx.stroke();
      ctx.fillStyle = C.ink2; ctx.fillText(formatTick(x, S.pi), px, py + 5);
    });
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    yt.ticks.forEach(function (y) {
      if (Math.abs(y) < yt.step * 1e-6) return;
      var py = Y(y), px = Math.min(Math.max(X(0), 36), W - 8);
      ctx.strokeStyle = C.axis; ctx.beginPath(); ctx.moveTo(px - 4, py); ctx.lineTo(px + 4, py); ctx.stroke();
      ctx.fillStyle = C.ink2; ctx.fillText(formatTick(y, false), px - 6, py);
    });
    if (X(0) > 10 && X(0) < W && Y(0) > 10 && Y(0) < H) {
      ctx.textAlign = "right"; ctx.textBaseline = "top";
      ctx.fillStyle = C.ink3; ctx.fillText("O", X(0) - 6, Y(0) + 5);
    }
  }
  function arrow(x, y, up) {
    ctx.beginPath();
    if (up) { ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 8); ctx.lineTo(x + 5, y + 8); }
    else { ctx.moveTo(x, y); ctx.lineTo(x - 8, y - 5); ctx.lineTo(x - 8, y + 5); }
    ctx.closePath(); ctx.fillStyle = ctx.strokeStyle; ctx.fill();
  }

  function strokePath(pts, ySpan, color, width, dash) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = width || 2.15; ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (dash) ctx.setLineDash(dash);
    var open = false;
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i], prev = pts[i - 1];
      if (!SX.finite(p.y) || (prev && SX.isBreak(prev, p, ySpan))) {
        if (open) { ctx.stroke(); ctx.beginPath(); open = false; }
        continue;
      }
      var sx = X(p.x), sy = Y(p.y);
      if (sy < -80 || sy > H + 80) {
        if (open) { ctx.lineTo(sx, sy < 0 ? -80 : H + 80); ctx.stroke(); ctx.beginPath(); open = false; }
        continue;
      }
      if (!open) { ctx.moveTo(sx, sy); open = true; }
      else ctx.lineTo(sx, sy);
    }
    if (open) ctx.stroke();
    ctx.restore();
  }

  function drawItem(item, color, sel) {
    var ySpan = S.view.ymax - S.view.ymin;
    var w = sel ? 2.6 : 2.15;
    if (item.kind === "explicit" && item.fn) {
      var n = Math.min(2200, Math.max(500, Math.round(W * 2.2)));
      var pts = SX.sampleFn(item.fn, S.view.xmin, S.view.xmax, n);
      strokePath(pts, ySpan, color, w);
      if (S.deriv && sel) {
        var dp = pts.map(function (p) { return { x: p.x, y: SX.d1(item.fn, p.x) }; });
        strokePath(dp, ySpan, color, 1.4, [5, 4]);
      }
    } else if (item.kind === "implicit" && item.Fx) {
      var segs = SX.sampleImplicit(item.Fx, S.view.xmin, S.view.xmax, S.view.ymin, S.view.ymax, Math.round(W / 3.2), Math.round(H / 3.2));
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.beginPath();
      for (var i = 0; i < segs.length; i += 2) {
        ctx.moveTo(X(segs[i][0]), Y(segs[i][1]));
        ctx.lineTo(X(segs[i + 1][0]), Y(segs[i + 1][1]));
      }
      ctx.stroke(); ctx.restore();
      if (item.conic) drawConicDecor(item.conic, color);
    } else if (item.kind === "param" && item.xt) {
      var rg = item.trange || [-10, 10];
      var m = 1200, pts2 = [];
      for (var j = 0; j <= m; j++) {
        var t = rg[0] + (rg[1] - rg[0]) * j / m;
        pts2.push({ x: item.xt(t), y: item.yt(t), t: t });
      }
      strokePath(pts2, ySpan, color, w);
    } else if (item.kind === "polar" && item.rt) {
      var rg2 = item.prange || item.trange || [0, 2 * PI];
      var m2 = 1400, pts3 = [];
      for (var k = 0; k <= m2; k++) {
        var th = rg2[0] + (rg2[1] - rg2[0]) * k / m2, r = item.rt(th);
        pts3.push({ x: r * Math.cos(th), y: r * Math.sin(th) });
      }
      strokePath(pts3, ySpan, color, w);
    } else if (item.kind === "ineq") {
      drawIneq(item, color, w, ySpan);
    }
  }

  function drawIneq(item, color, w, ySpan) {
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = color;
    if (item.ineqStyle === "y" && item.fn) {
      var op = item.ineqOp || ">";
      for (var i = 0; i < W; i++) {
        var x = Wx(i + 0.5), yb = item.fn(x);
        if (!SX.finite(yb)) continue;
        var yLo, yHi;
        if (op === ">" || op === ">=") { yLo = yb; yHi = S.view.ymax; }
        else { yLo = S.view.ymin; yHi = yb; }
        var top = Math.min(Y(yLo), Y(yHi)), bot = Math.max(Y(yLo), Y(yHi));
        if (bot > top) ctx.fillRect(i, top, 1.2, bot - top);
      }
      ctx.globalAlpha = 1;
      var n = Math.min(2200, Math.max(500, Math.round(W * 2)));
      strokePath(SX.sampleFn(item.fn, S.view.xmin, S.view.xmax, n), ySpan, color, w);
    } else if (item.holds) {
      var nx = Math.max(80, Math.round(W / 4)), ny = Math.max(60, Math.round(H / 4));
      var dw = W / nx, dh = H / ny;
      for (var j = 0; j < ny; j++) {
        for (var i = 0; i < nx; i++) {
          var x = Wx((i + 0.5) * dw), y = Wy((j + 0.5) * dh);
          if (item.holds(x, y)) ctx.fillRect(i * dw, j * dh, dw + 0.4, dh + 0.4);
        }
      }
      ctx.globalAlpha = 1;
      if (item.Fx) {
        var segs = SX.sampleImplicit(item.Fx, S.view.xmin, S.view.xmax, S.view.ymin, S.view.ymax, Math.round(W / 3.2), Math.round(H / 3.2));
        ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = "round"; ctx.lineCap = "round";
        ctx.beginPath();
        for (var i = 0; i < segs.length; i += 2) {
          ctx.moveTo(X(segs[i][0]), Y(segs[i][1]));
          ctx.lineTo(X(segs[i + 1][0]), Y(segs[i + 1][1]));
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawIntegral() {
    var e = selectedExplicit();
    if (!e) return;
    var a = S.intA, b = S.intB;
    if (a === b) return;
    var lo = Math.min(a, b), hi = Math.max(a, b);
    lo = Math.max(lo, S.view.xmin); hi = Math.min(hi, S.view.xmax);
    if (hi <= lo) return;
    var n = Math.max(40, Math.round((hi - lo) / (S.view.xmax - S.view.xmin) * W * 2));
    var pts = SX.sampleFn(e.fn, lo, hi, n);
    var color = hexColor(e.color);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(X(lo), Y(0));
    for (var i = 0; i < pts.length; i++) {
      if (SX.finite(pts[i].y)) ctx.lineTo(X(pts[i].x), Y(pts[i].y));
    }
    ctx.lineTo(X(hi), Y(0));
    ctx.closePath();
    ctx.globalAlpha = 0.22; ctx.fillStyle = color; ctx.fill();
    ctx.globalAlpha = 1; ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(X(S.intA), 0); ctx.lineTo(X(S.intA), H);
    ctx.moveTo(X(S.intB), 0); ctx.lineTo(X(S.intB), H); ctx.stroke();
    ctx.setLineDash([]);
    function handle(x, tag) {
      var sx = X(x), sy = Math.min(Math.max(Y(0), 14), H - 14);
      ctx.beginPath(); ctx.arc(sx, sy, 6, 0, 2 * PI); ctx.fillStyle = color; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = css("var(--paper)"); ctx.stroke();
      ctx.font = "11px " + getComputedStyle(document.body).fontFamily;
      ctx.fillStyle = css("var(--ink)"); ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText(tag, sx, sy - 8);
    }
    handle(S.intA, "a"); handle(S.intB, "b");
    ctx.restore();
  }

  function drawConicDecor(c, color) {
    if (!c || c.type === "degenerate" || c.type === "empty") return;
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.1; ctx.globalAlpha = 0.85;
    ctx.setLineDash([5, 4]);
    function line(a, b) {
      var pts = SX.linePoints(a, b, Math.max(S.view.xmax - S.view.xmin, S.view.ymax - S.view.ymin) * 2);
      ctx.beginPath(); ctx.moveTo(X(pts[0].x), Y(pts[0].y)); ctx.lineTo(X(pts[1].x), Y(pts[1].y)); ctx.stroke();
    }
    if (c.asymptotes) c.asymptotes.forEach(function (as) { line(as[0], as[1]); });
    if (c.directrix) line(c.directrix[0], c.directrix[1]);
    if (c.directrices) c.directrices.forEach(function (d) { line(d[0], d[1]); });
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    function flab(p, t) {
      ctx.font = "11px " + getComputedStyle(document.body).fontFamily;
      ctx.fillStyle = color; ctx.textAlign = "left"; ctx.textBaseline = "bottom";
      ctx.fillText(t, X(p.x) + 6, Y(p.y) - 5);
    }
    function foc(p) {
      ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 4, 0, 2 * PI); ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = css("var(--paper)"); ctx.stroke(); ctx.strokeStyle = color;
    }
    if (c.focus) { foc(c.focus); flab(c.focus, "F"); }
    if (c.foci) c.foci.forEach(function (p, i) { foc(p); flab(p, "F" + (i + 1)); });
    if (c.vertex && c.type === "parabola") {
      ctx.beginPath(); ctx.arc(X(c.vertex.x), Y(c.vertex.y), 3.2, 0, 2 * PI); ctx.fill();
    }
    if (c.center && (c.type === "ellipse" || c.type === "hyperbola" || c.type === "circle")) {
      ctx.beginPath(); ctx.arc(X(c.center.x), Y(c.center.y), 3, 0, 2 * PI); ctx.fill();
    }
    ctx.restore();
  }

  function collectMarks() {
    var out = { zeros: [], extrema: [], inter: [] };
    var ySpan = S.view.ymax - S.view.ymin;
    var visibles = S.exprs.filter(function (e) { return e.on && !e.error && e.kind === "explicit" && e.fn; });
    var focus = visibles.filter(function (e, i) { return S.exprs.indexOf(e) === S.sel; });
    if (!focus.length && visibles.length) focus = [visibles[0]];
    focus.forEach(function (e) {
      SX.findZeros(e.fn, S.view.xmin, S.view.xmax, ySpan, 900).forEach(function (x) {
        out.zeros.push({ x: x, y: 0, e: e });
      });
      SX.findExtrema(e.fn, S.view.xmin, S.view.xmax, ySpan, 900).forEach(function (p) {
        out.extrema.push({ x: p.x, y: p.y, kind: p.kind, e: e });
      });
    });
    for (var i = 0; i < visibles.length; i++) {
      for (var j = i + 1; j < visibles.length; j++) {
        if (focus.indexOf(visibles[i]) < 0 && focus.indexOf(visibles[j]) < 0) continue;
        SX.findIntersections(visibles[i].fn, visibles[j].fn, S.view.xmin, S.view.xmax, ySpan, 900).forEach(function (p) {
          out.inter.push({ x: p.x, y: p.y, a: visibles[i], b: visibles[j] });
        });
      }
    }
    return out;
  }

  function drawMarks() {
    var m = collectMarks();
    S._marks = m;
    function lab(p, text, fill) {
      var sx = X(p.x), sy = Y(p.y);
      if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) return;
      ctx.beginPath(); ctx.arc(sx, sy, 4.2, 0, 2 * PI); ctx.fillStyle = fill; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = css("var(--paper)"); ctx.stroke();
      var pad = 4, fs = 11, font = fs + "px " + getComputedStyle(document.body).fontFamily;
      ctx.font = font;
      var tw = ctx.measureText(text).width;
      var lx = sx + 8, ly = sy - 16;
      if (lx + tw + 10 > W) lx = sx - tw - 16;
      if (ly < 4) ly = sy + 10;
      ctx.fillStyle = css("var(--card)");
      ctx.strokeStyle = css("var(--line)"); ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(lx - pad, ly - pad, tw + pad * 2, fs + pad * 2, 5);
      else ctx.rect(lx - pad, ly - pad, tw + pad * 2, fs + pad * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = css("var(--ink)"); ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(text, lx, ly);
    }
    var cap = 10;
    m.zeros.slice(0, cap).forEach(function (p) {
      lab(p, "(" + SX.formatNum(p.x) + ", 0)", hexColor(p.e.color));
    });
    m.extrema.slice(0, cap).forEach(function (p) {
      lab(p, (p.kind === "max" ? "极大 " : "极小 ") + "(" + SX.formatNum(p.x) + ", " + SX.formatNum(p.y) + ")", hexColor(p.e.color));
    });
    m.inter.slice(0, cap).forEach(function (p) {
      lab(p, "交 (" + SX.formatNum(p.x) + ", " + SX.formatNum(p.y) + ")", css("var(--ink)"));
    });
  }

  function selectedExplicit() {
    var e = S.exprs[S.sel];
    return e && e.on && e.kind === "explicit" && e.fn && !e.error ? e : null;
  }

  function drawTangent() {
    var e = selectedExplicit();
    if (!e) return;
    var x0 = S.tanX;
    if (x0 < S.view.xmin || x0 > S.view.xmax) x0 = (S.view.xmin + S.view.xmax) / 2;
    var cusps = SX.findCusps(e.fn, S.view.xmin, S.view.xmax, 220);
    var snap = null, best = Infinity, pxTol = (S.view.xmax - S.view.xmin) / W * 14;
    for (var i = 0; i < cusps.length; i++) {
      var d = Math.abs(cusps[i] - x0);
      if (d < best && d < pxTol) { best = d; snap = cusps[i]; }
    }
    if (snap != null) x0 = snap;
    var y0 = e.fn(x0), d = SX.derivAt(e.fn, x0);
    if (!SX.finite(y0)) { S._tan = null; return; }
    var color = hexColor(e.color);
    S._tan = { x: x0, y: y0, k: d.k, e: e, smooth: d.smooth, vertical: d.vertical, left: d.left, right: d.right };
    ctx.save();
    if (d.smooth && SX.finite(d.k) && Math.abs(d.k) < 1e6) {
      var k = d.k;
      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([2, 3]); ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(X(S.view.xmin), Y(y0 + k * (S.view.xmin - x0)));
      ctx.lineTo(X(S.view.xmax), Y(y0 + k * (S.view.xmax - x0)));
      ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    } else if (!d.smooth && !d.vertical) {
      ctx.setLineDash([3, 3]); ctx.lineWidth = 1.3; ctx.strokeStyle = color; ctx.globalAlpha = 0.55;
      function half(k, dir) {
        if (!SX.finite(k)) return;
        ctx.beginPath();
        ctx.moveTo(X(x0), Y(y0));
        var x1 = x0 + dir * (S.view.xmax - S.view.xmin) * 0.25;
        ctx.lineTo(X(x1), Y(y0 + k * (x1 - x0)));
        ctx.stroke();
      }
      half(d.left, -1); half(d.right, 1);
      ctx.globalAlpha = 1; ctx.setLineDash([]);
    }
    var sx = X(x0), sy = Y(y0);
    ctx.beginPath(); ctx.arc(sx, sy, 6, 0, 2 * PI);
    ctx.fillStyle = d.smooth ? color : "transparent";
    if (d.smooth) ctx.fill();
    ctx.lineWidth = 2.2; ctx.strokeStyle = d.smooth ? css("var(--paper)") : color; ctx.stroke();
    if (!d.smooth) { ctx.beginPath(); ctx.arc(sx, sy, 6, 0, 2 * PI); ctx.strokeStyle = color; ctx.stroke(); }
    var text = d.vertical ? "切线垂直" : (!d.smooth ? "不可导" : ("k = " + SX.formatNum(d.k)));
    if (!d.smooth && !d.vertical && SX.finite(d.left) && SX.finite(d.right)) {
      text = "不可导  左 " + SX.formatNum(d.left) + "，右 " + SX.formatNum(d.right);
    }
    ctx.font = "12px " + getComputedStyle(document.body).fontFamily;
    var tw = ctx.measureText(text).width, lx = sx + 10, ly = sy - 22;
    ctx.fillStyle = css("var(--card)"); ctx.strokeStyle = css("var(--line)"); ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(lx - 4, ly - 3, tw + 8, 18, 5); else ctx.rect(lx - 4, ly - 3, tw + 8, 18);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = css("var(--ink)"); ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText(text, lx, ly);
    ctx.restore();
  }

  function drawTrace(C) {
    var t = S.trace;
    ctx.save();
    ctx.strokeStyle = C.ink3; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(X(t.x), 0); ctx.lineTo(X(t.x), H);
    ctx.moveTo(0, Y(t.y)); ctx.lineTo(W, Y(t.y)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(X(t.x), Y(t.y), 4.5, 0, 2 * PI);
    ctx.fillStyle = t.color || C.acc; ctx.fill();
    ctx.strokeStyle = C.paper; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }

  function updateHud() {
    var el = $("#hud");
    var bits = [];
    if (S.trace && SX.finite(S.trace.x)) {
      bits.push("x = <b>" + SX.formatNum(S.trace.x) + "</b>");
      bits.push("y = <b>" + SX.formatNum(S.trace.y) + "</b>");
      if (S.trace.k != null && SX.finite(S.trace.k)) bits.push("y′ = <b>" + SX.formatNum(S.trace.k) + "</b>");
    } else {
      bits.push("窗口 <b>" + SX.formatNum(S.view.xmin) + "</b> ~ <b>" + SX.formatNum(S.view.xmax) + "</b>");
    }
    el.innerHTML = bits.join("<br>");
  }

  /* ---------- 列表与信息 ---------- */
  function latexHTML(src, kind, item) {
    try {
      var tex;
      if (kind === "param") tex = "x=" + (SX.latexOf(item.srcx) || item.srcx) + ",\\; y=" + (SX.latexOf(item.srcy) || item.srcy);
      else if (kind === "polar") tex = "r=" + (SX.latexOf(String(item.src).replace(/^\s*r\s*=\s*/i, "")) || item.src);
      else if (kind === "implicit" || kind === "ineq") tex = SX.latexOf(item.src) || item.src;
      else tex = "y=" + (SX.latexOf(item.src) || item.src);
      return katex.renderToString(tex, { throwOnError: false, displayMode: false });
    } catch (e) { return escapeH(item.src || src); }
  }
  function escapeH(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[c]; }); }

  function renderList() {
    var box = $("#elist");
    if (!S.exprs.length) {
      box.innerHTML = '<p class="info empty" style="border:0;background:transparent;padding:8px 4px">添加一个表达式，或从图库载入常见函数。</p>';
      renderSliders(); renderInfo(); return;
    }
    box.innerHTML = S.exprs.map(function (e, i) {
      return '<div class="erow' + (i === S.sel ? " sel" : "") + (e.on ? "" : " off") + '" data-i="' + i + '">' +
        '<button type="button" class="sw" style="background:' + hexColor(e.color) + '" aria-label="选中此式"></button>' +
        '<div class="body"><div class="tex">' + latexHTML(e.src, e.kind, e) + '</div>' +
        (e.error ? '<p class="err">' + escapeH(e.error) + "</p>" : "") + "</div>" +
        '<div class="acts">' +
        '<button type="button" data-act="vis" title="显示或隐藏" aria-label="显示或隐藏">' + (e.on ? EYEO : EYEX) + "</button>" +
        '<button type="button" data-act="del" title="删除" aria-label="删除">×</button>' +
        "</div></div>";
    }).join("");
    renderSliders(); renderInfo();
    if (window.Motion) Motion.stagger(box, ".erow", 28, 10);
    Motion && Motion.refresh();
  }

  function renderSliders() {
    var names = {};
    S.exprs.forEach(function (e) {
      if (!e.on || !e.params) return;
      Object.keys(e.params).forEach(function (k) { names[k] = e.params[k]; });
    });
    var keys = Object.keys(names);
    var box = $("#sliders");
    if (!keys.length) { box.innerHTML = ""; return; }
    box.innerHTML = keys.map(function (k) {
      var p = names[k];
      return '<div class="prm" data-p="' + escapeH(k) + '"><div class="hd"><span>' + escapeH(k) + ' = <b>' + SX.formatNum(p.v) + "</b></span>" +
        '<button type="button" class="play" data-act="play">播放</button></div>' +
        '<input type="range" min="' + p.min + '" max="' + p.max + '" step="0.01" value="' + p.v + '"></div>';
    }).join("");
  }

  function renderInfo() {
    var el = $("#info");
    var e = S.exprs[S.sel];
    if (!e || e.error) { el.hidden = true; el.innerHTML = ""; return; }
    var rows = [];
    if ((e.kind === "explicit" || (e.kind === "ineq" && e.fn)) && e.fn) {
      if (S._marks && e.kind === "explicit") {
        var zs = S._marks.zeros.filter(function (p) { return p.e === e; });
        var ex = S._marks.extrema.filter(function (p) { return p.e === e; });
        if (zs.length) rows.push(["零点", zs.map(function (p) { return SX.formatNum(p.x); }).join("，")]);
        ex.forEach(function (p) { rows.push([p.kind === "max" ? "极大值" : "极小值", "(" + SX.formatNum(p.x) + ", " + SX.formatNum(p.y) + ")"]); });
      }
      if (S.deriv && S._tan && S._tan.e === e) {
        if (!S._tan.smooth) {
          var msg = S._tan.vertical ? "此处切线垂直或一侧无定义" : "不可导";
          if (!S._tan.vertical && SX.finite(S._tan.left) && SX.finite(S._tan.right)) {
            msg = "不可导（左 " + SX.formatNum(S._tan.left) + "，右 " + SX.formatNum(S._tan.right) + "）";
          }
          rows.push(["切线", msg]);
        } else rows.push(["切线斜率", SX.formatNum(S._tan.k)]);
      }
      try {
        var pr = SX.analyzeProps(e.fn, e.node || e.rhs, S.view.xmin, S.view.xmax);
        rows.push(["奇偶性", pr.parity]);
        rows.push(["周期", pr.period != null ? SX.formatNum(pr.period) : "不是周期函数"]);
        if (pr.hints.length) rows.push(["定义域", pr.hints.join("；")]);
        if (pr.segs.length && pr.segs.length < 8) {
          rows.push(["窗口内有定义", pr.segs.map(function (s) { return SX.formatNum(s[0]) + " ~ " + SX.formatNum(s[1]); }).join("，")]);
        }
        if (pr.mono && pr.mono.length && pr.mono.length <= 8) {
          var md = { "增": "递增", "减": "递减", "常": "为常数" };
          rows.push(["单调区间", pr.mono.map(function (m) { return "(" + SX.formatNum(m.a) + ", " + SX.formatNum(m.b) + ") " + (md[m.dir] || m.dir); }).join("；")]);
        }
      } catch (err) {}
      if (S.integ && e.kind === "explicit") {
        var I = SX.integrate(e.fn, S.intA, S.intB, 640);
        rows.push(["定积分 ∫[" + SX.formatNum(S.intA) + "," + SX.formatNum(S.intB) + "]", SX.formatNum(I.value)]);
        rows.push(["面积（绝对值）", SX.formatNum(I.abs)]);
      }
    }
    if (e.conic && e.conic.type && e.conic.type !== "degenerate") {
      var c = e.conic;
      var typeName = { circle: "圆", ellipse: "椭圆", hyperbola: "双曲线", parabola: "抛物线" }[c.type] || c.type;
      rows.push(["类型", typeName]);
      if (c.center) rows.push(["中心", "(" + SX.formatNum(c.center.x) + ", " + SX.formatNum(c.center.y) + ")"]);
      if (c.r != null) rows.push(["半径", SX.formatNum(c.r)]);
      if (c.a != null && c.type !== "circle") rows.push(["a，b", SX.formatNum(c.a) + "，" + SX.formatNum(c.b)]);
      if (c.c != null) rows.push(["c", SX.formatNum(c.c)]);
      if (c.e != null) rows.push(["离心率 e", SX.formatNum(c.e)]);
      if (c.p != null) rows.push(["p", SX.formatNum(c.p)]);
      if (c.focus) rows.push(["焦点", "(" + SX.formatNum(c.focus.x) + ", " + SX.formatNum(c.focus.y) + ")"]);
      if (c.foci) rows.push(["焦点", c.foci.map(function (p) { return "(" + SX.formatNum(p.x) + ", " + SX.formatNum(p.y) + ")"; }).join("，")]);
      if (c.vertex) rows.push(["顶点", "(" + SX.formatNum(c.vertex.x) + ", " + SX.formatNum(c.vertex.y) + ")"]);
    }
    if (!rows.length) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    var html = "<h3>特征</h3>" + rows.map(function (r) { return '<div class="row"><span>' + r[0] + "</span><b>" + escapeH(r[1]) + "</b></div>"; }).join("");
    if (e.fn && e.kind === "explicit") {
      var ticks = niceTicks(S.view.xmin, S.view.xmax, S.pi, 6).ticks.filter(function (x, i, a) { return i === 0 || i === a.length - 1 || i % Math.max(1, Math.round(a.length / 6)) === 0; }).slice(0, 7);
      if (ticks.length) {
        var tab = SX.valueTable(e.fn, ticks);
        html += "<h3>取值</h3><table class=\"vtab\"><tr><th>x</th>" + tab.map(function (r) { return "<th>" + escapeH(SX.formatNum(r.x)) + "</th>"; }).join("") + "</tr><tr><td>y</td>" + tab.map(function (r) { return "<td>" + escapeH(SX.formatNum(r.y)) + "</td>"; }).join("") + "</tr></table>";
      }
      if (S.integ) {
        html += '<div class="intedit">积分区间 <input id="inta" type="text" value="' + escapeH(SX.formatNum(S.intA)) + '"> 到 <input id="intb" type="text" value="' + escapeH(SX.formatNum(S.intB)) + '"></div>';
      }
    }
    el.innerHTML = html;
    if (S.integ && e.fn) {
      function readBound(id, def) {
        var v = SX.eval(SX.parse($("#"+id).value || "0"), {});
        return SX.finite(v) ? v : def;
      }
      ["inta","intb"].forEach(function (id) {
        var inp = $("#"+id); if (!inp) return;
        inp.addEventListener("change", function () {
          if (id === "inta") S.intA = readBound("inta", S.intA); else S.intB = readBound("intb", S.intB);
          draw(); renderInfo(); persist();
        });
        inp.addEventListener("keydown", function (ev) { if (ev.key === "Enter") ev.target.blur(); });
      });
    }
  }

  function renderTools() {
    var items = [
      ["reset", "复位", false], ["fit", "适应", false], ["aspect", "等比例", S.aspect],
      ["pi", "π 刻度", S.pi], ["grid", "网格", S.grid], ["marks", "标注", S.marks], ["deriv", "导数", S.deriv], ["integ", "积分", S.integ]
    ];
    $("#tools").innerHTML = items.map(function (it) {
      return '<button type="button" data-t="' + it[0] + '" class="' + (it[2] ? "on" : "") + '">' + it[1] + "</button>";
    }).join("");
    if (window.Motion) Motion.refresh();
  }

  function renderGallery() {
    var box = $("#galBody");
    box.innerHTML = PRESETS.map(function (sec) {
      return '<div class="gsec">' + sec.g + "</div>" + sec.items.map(function (it, i) {
        var expr = it.multi ? it.multi.join("；") : (it.e || ("x=" + it.x + ", y=" + it.y));
        return '<button type="button" class="gitem" data-g="' + escapeH(sec.g) + '" data-i="' + i + '">' +
          '<span class="n">' + escapeH(it.n) + '</span><span class="e">' + escapeH(expr) + '</span><span class="d">' + escapeH(it.d) + "</span></button>";
      }).join("");
    }).join("");
  }

  function setMode(m) {
    S.mode = m;
    $$("#modes button").forEach(function (b) { b.classList.toggle("on", b.dataset.m === m); });
    var param = m === "param";
    $("#paramIn").hidden = !param;
    $("#fin").style.display = param ? "none" : "flex";
    $("#exprPre").textContent = m === "polar" ? "r =" : m === "implicit" ? "" : "y =";
    var ph = { explicit: "sin(x) 或 {x^2, x<0; 2x, x>=0}", implicit: "x^2/4+y^2/9=1", polar: "2*cos(θ)", param: "" };
    $("#exprIn").placeholder = ph[m] || "";
    if (window.Motion) Motion.refresh();
  }

  /* ---------- 交互 ---------- */
  function toast(msg) {
    var el = $("#toast"); el.textContent = msg; el.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove("on"); }, 1800);
  }

  function persist() {
    var o = snapshot();
    try { localStorage.setItem(STORE, JSON.stringify(o)); } catch (e) {}
    var h = "#s=" + encodeURIComponent(JSON.stringify(o));
    if (location.hash !== h) history.replaceState(null, "", h);
  }
  function snapshot() {
    return {
      e: S.exprs.map(function (e) {
        return { k: e.kind, s: e.src, x: e.srcx, y: e.srcy, on: e.on, c: e.color, p: paramVals(e), t: e.trange, r: e.prange };
      }),
      v: [S.view.xmin, S.view.xmax, S.view.ymin, S.view.ymax],
      o: { a: S.aspect, pi: S.pi, g: S.grid, m: S.marks, d: S.deriv, integ: S.integ, ia: S.intA, ib: S.intB, tx: S.tanX, theme: S.theme, sel: S.sel, mode: S.mode }
    };
  }
  function loadSnap(o) {
    if (!o || !o.e) return false;
    S.exprs = [];
    (o.e || []).forEach(function (r) {
      addExpr({ kind: r.k, src: r.s, srcx: r.x, srcy: r.y, on: r.on !== false, t: r.t, tr: r.r, p: r.p });
      var last = S.exprs[S.exprs.length - 1];
      if (r.c != null) last.color = r.c;
    });
    if (o.v && o.v.length === 4) S.view = { xmin: +o.v[0], xmax: +o.v[1], ymin: +o.v[2], ymax: +o.v[3] };
    var opt = o.o || {};
    if (opt.a != null) S.aspect = !!opt.a;
    if (opt.pi != null) S.pi = !!opt.pi;
    if (opt.g != null) S.grid = !!opt.g;
    if (opt.m != null) S.marks = !!opt.m;
    if (opt.d != null) S.deriv = !!opt.d;
    if (opt.integ != null) S.integ = !!opt.integ;
    if (opt.ia != null) S.intA = +opt.ia;
    if (opt.ib != null) S.intB = +opt.ib;
    if (opt.tx != null) S.tanX = +opt.tx;
    if (opt.theme) setTheme(opt.theme, true);
    if (opt.mode) setMode(opt.mode);
    if (opt.sel != null && opt.sel < S.exprs.length) S.sel = opt.sel;
    return true;
  }

  function setTheme(t, silent) {
    S.theme = t === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = S.theme === "dark" ? "dark" : "";
    if (!document.documentElement.dataset.theme) delete document.documentElement.dataset.theme;
    var meta = $("meta[name=theme-color]");
    if (meta) meta.setAttribute("content", S.theme === "dark" ? "#12171e" : "#f3efe6");
    cssColorCache = {};
    if (!silent) { draw(); persist(); }
  }

  function composeFromForm() {
    if (S.mode === "param") {
      var x = $("#xin").value.trim(), y = $("#yin").value.trim();
      if (!x || !y) return;
      addExpr({ kind: "param", srcx: x, srcy: y });
      $("#xin").value = ""; $("#yin").value = "";
    } else {
      var s = $("#exprIn").value.trim();
      if (!s) return;
      var kind = S.mode;
      var det = SX.detectKind(S.mode === "explicit" && !/^\s*y\s*=/i.test(s) ? "y=" + s : s);
      if (det.kind === "param" || det.kind === "polar" || det.kind === "implicit" || det.kind === "ineq") kind = det.kind;
      if (kind === "param") addExpr({ kind: "param", srcx: det.rawx, srcy: det.rawy });
      else addExpr({ kind: kind, src: det.raw || s });
      $("#exprIn").value = "";
    }
    afterChange();
  }

  function afterChange() {
    renderList();
    if (S.aspect) applyAspect();
    draw();
    renderInfo();
    persist();
  }

  function loadPreset(it) {
    S.exprs = [];
    var list = it.multi ? it.multi.map(function (s) { return { e: s, p: it.p, k: it.k }; }) : [it];
    list.forEach(function (spec) {
      addExpr({ kind: spec.k || it.k || "explicit", src: spec.e || spec.src, x: spec.x || it.x, y: spec.y || it.y, p: spec.p || it.p, t: it.t, tr: it.tr });
    });
    if (it.v) {
      S.view.xmin = it.v[0]; S.view.xmax = it.v[1];
      if (it.v[2] != null) { S.view.ymin = it.v[2]; S.view.ymax = it.v[3]; }
      if (S.aspect) applyAspect();
    }
    if (it.pi != null) S.pi = !!it.pi;
    if (it.deriv) S.deriv = true;
    if (it.aspect != null) { S.aspect = !!it.aspect; if (S.aspect) applyAspect(); }
    closeGallery();
    renderTools();
    afterChange();
    toast("已载入「" + it.n + "」");
  }

  function fitView() {
    var xs = [], ys = [];
    S.exprs.forEach(function (e) {
      if (!e.on || e.error) return;
      if (e.fn) {
        var pts = SX.sampleFn(e.fn, S.view.xmin, S.view.xmax, 400);
        pts.forEach(function (p) { if (SX.finite(p.y) && Math.abs(p.y) < 1e6) { xs.push(p.x); ys.push(p.y); } });
      }
    });
    if (!ys.length) { S.view = { xmin: -8, xmax: 8, ymin: -4.5, ymax: 4.5 }; if (S.aspect) applyAspect(); return; }
    var miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys);
    if (miny === maxy) { miny -= 1; maxy += 1; }
    var pad = (maxy - miny) * 0.12 || 1;
    S.view.ymin = miny - pad; S.view.ymax = maxy + pad;
    if (S.aspect) {
      var midy = (S.view.ymin + S.view.ymax) / 2, mid = (S.view.xmin + S.view.xmax) / 2;
      var hy = (S.view.ymax - S.view.ymin) / 2;
      var hx = hy * W / H;
      S.view.xmin = mid - hx; S.view.xmax = mid + hx;
      S.view.ymin = midy - hy; S.view.ymax = midy + hy;
    }
  }

  function zoomAt(sx, sy, f) {
    var x = Wx(sx), y = Wy(sy);
    S.view.xmin = x + (S.view.xmin - x) * f;
    S.view.xmax = x + (S.view.xmax - x) * f;
    S.view.ymin = y + (S.view.ymin - y) * f;
    S.view.ymax = y + (S.view.ymax - y) * f;
    draw(); persist();
  }

  function nearestTrace(sx, sy) {
    var best = null, bd = 28;
    S.exprs.forEach(function (e) {
      if (!e.on || e.error) return;
      if (e.fn) {
        var x = Wx(sx), y = e.fn(x);
        if (!SX.finite(y)) return;
        var d = Math.hypot(X(x) - sx, Y(y) - sy);
        if (d < bd) { bd = d; best = { x: x, y: y, color: hexColor(e.color), k: SX.d1(e.fn, x), e: e }; }
      }
    });
    if (!best) {
      var x2 = Wx(sx), y2 = Wy(sy);
      best = { x: x2, y: y2, color: css("var(--acc)") };
    }
    return best;
  }

  function onPointer(e) {
    var r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  var pointers = new Map();
  var lastPinch = 0;

  cv.addEventListener("pointerdown", function (e) {
    cv.setPointerCapture(e.pointerId);
    var p = onPointer(e);
    pointers.set(e.pointerId, p);
    if (S.integ) {
      var da = Math.abs(p.x - X(S.intA)), db = Math.abs(p.x - X(S.intB));
      if (da < 12 || db < 12) { S.dragging = da <= db ? "inta" : "intb"; return; }
    }
    if (S.deriv && S._tan) {
      if (Math.hypot(p.x - X(S._tan.x), p.y - Y(S._tan.y)) < 16) {
        S.dragging = "tan"; return;
      }
    }
    if (pointers.size === 1) S.dragging = "pan";
    else S.dragging = "pinch";
  });
  cv.addEventListener("pointermove", function (e) {
    var p = onPointer(e);
    if (!pointers.has(e.pointerId) && e.buttons === 0) {
      S.trace = nearestTrace(p.x, p.y); draw(); return;
    }
    var prev = pointers.get(e.pointerId);
    pointers.set(e.pointerId, p);
    if (S.dragging === "tan") {
      S.tanX = Wx(p.x); draw(); renderInfo(); return;
    }
    if (S.dragging === "inta" || S.dragging === "intb") {
      var x = Wx(p.x);
      if (S.dragging === "inta") S.intA = x; else S.intB = x;
      draw(); renderInfo(); return;
    }
    if (S.dragging === "pan" && prev && pointers.size === 1) {
      var dx = Wx(prev.x) - Wx(p.x), dy = Wy(prev.y) - Wy(p.y);
      S.view.xmin += dx; S.view.xmax += dx; S.view.ymin += dy; S.view.ymax += dy;
      S.trace = nearestTrace(p.x, p.y); draw(); return;
    }
    if (pointers.size === 2) {
      var arr = Array.from(pointers.values());
      var d = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
      if (lastPinch) {
        var mid = { x: (arr[0].x + arr[1].x) / 2, y: (arr[0].y + arr[1].y) / 2 };
        zoomAt(mid.x, mid.y, lastPinch / d);
      }
      lastPinch = d;
    }
  });
  function pend(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) lastPinch = 0;
    if (!pointers.size) { S.dragging = null; persist(); }
  }
  cv.addEventListener("pointerup", pend);
  cv.addEventListener("pointercancel", pend);
  cv.addEventListener("pointerleave", function () { if (!pointers.size) { S.trace = null; draw(); } });
  cv.addEventListener("wheel", function (e) {
    e.preventDefault();
    var p = onPointer(e);
    zoomAt(p.x, p.y, Math.exp(e.deltaY * 0.0015));
  }, { passive: false });

  $("#elist").addEventListener("click", function (e) {
    var row = e.target.closest(".erow"); if (!row) return;
    var i = +row.dataset.i, act = e.target.dataset.act;
    if (act === "del") { S.exprs.splice(i, 1); if (S.sel >= S.exprs.length) S.sel = S.exprs.length - 1; afterChange(); return; }
    if (act === "vis") { S.exprs[i].on = !S.exprs[i].on; afterChange(); return; }
    S.sel = i;
    if (e.target.closest(".tex")) startEdit(row, i);
    renderList(); draw();
  });

  function startEdit(row, i) {
    var e = S.exprs[i];
    var body = row.querySelector(".body");
    var val = e.kind === "param" ? ("x=" + e.srcx + ", y=" + e.srcy) : e.src;
    body.innerHTML = '<input class="edit" value="' + escapeH(val) + '">';
    var inp = body.querySelector("input"); inp.focus(); inp.select();
    function commit() {
      var s = inp.value.trim(); if (!s) return;
      if (e.kind === "param") {
        var d = SX.detectKind(s);
        if (d.kind === "param") { e.srcx = d.rawx; e.srcy = d.rawy; }
      } else { e.src = s; }
      compileExpr(e); afterChange();
    }
    inp.addEventListener("blur", commit);
    inp.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); inp.blur(); } if (ev.key === "Escape") { ev.preventDefault(); renderList(); } });
  }

  $("#sliders").addEventListener("input", function (e) {
    if (e.target.type !== "range") return;
    var name = e.target.closest(".prm").dataset.p, v = +e.target.value;
    S.exprs.forEach(function (item) {
      if (item.params && item.params[name]) item.params[name].v = v;
      if (item.kind === "implicit") compileExpr(item);
    });
    e.target.closest(".prm").querySelector("b").textContent = SX.formatNum(v);
    draw(); renderInfo();
  });
  $("#sliders").addEventListener("change", persist);
  $("#sliders").addEventListener("click", function (e) {
    if (e.target.dataset.act !== "play") return;
    var name = e.target.closest(".prm").dataset.p;
    if (anims[name]) { clearInterval(anims[name]); delete anims[name]; e.target.textContent = "播放"; return; }
    e.target.textContent = "停止";
    var dir = 1;
    anims[name] = setInterval(function () {
      var sample = null;
      S.exprs.forEach(function (item) { if (item.params && item.params[name]) sample = item.params[name]; });
      if (!sample) return;
      var nv = sample.v + dir * (sample.max - sample.min) / 120;
      if (nv > sample.max) { nv = sample.max; dir = -1; }
      if (nv < sample.min) { nv = sample.min; dir = 1; }
      S.exprs.forEach(function (item) {
        if (item.params && item.params[name]) item.params[name].v = nv;
        if (item.kind === "implicit") compileExpr(item);
      });
      var prm = $$("#sliders .prm").filter(function (n) { return n.dataset.p === name; })[0];
      var inp = prm && prm.querySelector("input");
      var lab = prm && prm.querySelector("b");
      if (inp) inp.value = nv; if (lab) lab.textContent = SX.formatNum(nv);
      draw(); renderInfo();
    }, 30);
  });

  $("#composer").addEventListener("submit", function (e) { e.preventDefault(); composeFromForm(); });
  $("#tools").addEventListener("click", function (e) {
    var t = e.target.dataset.t; if (!t) return;
    if (t === "reset") { S.view = { xmin: -8, xmax: 8, ymin: -4.5, ymax: 4.5 }; if (S.aspect) applyAspect(); }
    else if (t === "fit") fitView();
    else if (t === "aspect") { S.aspect = !S.aspect; if (S.aspect) applyAspect(); }
    else if (t === "pi") S.pi = !S.pi;
    else if (t === "grid") S.grid = !S.grid;
    else if (t === "marks") S.marks = !S.marks;
    else if (t === "deriv") S.deriv = !S.deriv;
    else if (t === "integ") {
      S.integ = !S.integ;
      if (S.integ) {
        var span = S.view.xmax - S.view.xmin;
        if (S.intA < S.view.xmin || S.intB > S.view.xmax || S.intA === S.intB) {
          S.intA = S.view.xmin + span * 0.25; S.intB = S.view.xmin + span * 0.75;
        }
      }
    }
    renderTools(); draw(); renderInfo(); persist();
  });
  $$("#modes button").forEach(function (b) { b.addEventListener("click", function () { setMode(b.dataset.m); }); });

  var CHIPS = {
    explicit: ["sin", "cos", "tan", "ln", "log", "sqrt", "abs", "^", "π", "{ }", "e"],
    implicit: ["x^2", "y^2", "^", "/", "π", "=", "<", ">"],
    param: ["cos(t)", "sin(t)", "t", "π"],
    polar: ["cos(θ)", "sin(θ)", "θ", "π"]
  };
  function renderChips() {
    var arr = CHIPS[S.mode] || CHIPS.explicit;
    $("#chips").innerHTML = arr.map(function (s) { return '<button type="button" data-c="' + escapeH(s) + '">' + escapeH(s) + "</button>"; }).join("");
  }
  $("#chips").addEventListener("click", function (e) {
    var c = e.target.dataset.c; if (!c) return;
    var inp = S.mode === "param" ? ($("#xin") === document.activeElement ? $("#xin") : $("#yin")) : $("#exprIn");
    var start = inp.selectionStart || inp.value.length, v = inp.value;
    var ins = c;
    if (c === "{ }") ins = "{ , ; }";
    else if (/^[a-z]+$/i.test(c) && c.length > 1 && c !== "pi") ins = c + "()";
    inp.value = v.slice(0, start) + ins + v.slice(inp.selectionEnd || start);
    inp.focus();
    var pos = start + (ins.endsWith("()") ? ins.length - 1 : ins.length);
    inp.setSelectionRange(pos, pos);
  });
  var modeObs = new MutationObserver(renderChips);
  $$("#modes button").forEach(function (b) { b.addEventListener("click", renderChips); });

  function openGallery() {
    $("#gallery").hidden = false; $("#scrim").hidden = false;
    if (window.Motion) { Motion.enter($("#gallery")); Motion.stagger($("#galBody"), ".gitem", 18, 16); }
  }
  function closeGallery() { $("#gallery").hidden = true; $("#scrim").hidden = true; }
  $("#btnGallery").onclick = openGallery;
  $("#galClose").onclick = closeGallery;
  $("#scrim").onclick = closeGallery;
  $("#galBody").addEventListener("click", function (e) {
    var it = e.target.closest(".gitem"); if (!it) return;
    var sec = PRESETS.find(function (s) { return s.g === it.dataset.g; });
    if (sec) loadPreset(sec.items[+it.dataset.i]);
  });

  $("#btnTheme").onclick = function () { setTheme(S.theme === "dark" ? "light" : "dark"); };
  $("#btnShare").onclick = function () {
    persist();
    var url = location.href;
    if (navigator.share) {
      navigator.share({ title: "数形 · 函数画板", url: url }).catch(function () { copy(url); });
    } else copy(url);
  };
  function copy(t) {
    (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () {
      toast("链接已复制");
    }).catch(function () {
      var i = document.createElement("input"); i.value = t; document.body.appendChild(i); i.select();
      try { document.execCommand("copy"); toast("链接已复制"); } catch (e) { toast(t); }
      i.remove();
    });
  }

  $("#btnExport").onclick = function () { exportPNG(); };
  function exportPNG() {
    var scale = 2;
    var off = document.createElement("canvas");
    off.width = Math.round(W * scale * dpr / dpr); /* keep css pixels * scale */
    off.width = Math.round(W * scale); off.height = Math.round(H * scale);
    var c2 = off.getContext("2d");
    var old = { w: W, h: H, ctx: ctx, cv: cv };
    /* redraw at scale by temporarily swapping */
    var tmp = document.createElement("canvas");
    tmp.width = Math.round(W * scale); tmp.height = Math.round(H * scale);
    var savedDpr = dpr, savedW = W, savedH = H, savedCtx = ctx;
    ctx = tmp.getContext("2d");
    dpr = 1; W = tmp.width; H = tmp.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var aspectWas = S.aspect; S.aspect = false;
    draw();
    S.aspect = aspectWas;
    ctx = savedCtx; dpr = savedDpr; W = savedW; H = savedH;
    var C = themeColors();
    c2.fillStyle = C.paper; c2.fillRect(0, 0, off.width, off.height);
    c2.drawImage(tmp, 0, 0);
    c2.font = "13px " + getComputedStyle(document.body).fontFamily;
    c2.fillStyle = C.ink3;
    c2.fillText("数形 · 函数画板", 16, off.height - 16);
    var x = 16, y = 22;
    S.exprs.forEach(function (e, i) {
      if (!e.on) return;
      c2.fillStyle = hexColor(e.color);
      var label = e.kind === "param" ? ("x=" + e.srcx + ", y=" + e.srcy) : (e.kind === "polar" ? "r=" + e.src : (e.kind === "implicit" ? e.src : "y=" + e.src));
      c2.fillText(label, x, y + i * 18);
    });
    off.toBlob(function (blob) {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "数形.png";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      toast("已导出图片");
    }, "image/png");
  }

  $("#sheetTog").onclick = function () {
    var on = $("#side").classList.toggle("open");
    $("#sheetTog").setAttribute("aria-expanded", on ? "true" : "false");
  };
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (!$("#gallery").hidden) { closeGallery(); e.preventDefault(); return; }
      if ($("#side").classList.contains("open")) { $("#side").classList.remove("open"); e.preventDefault(); }
    }
    if (/^(INPUT|TEXTAREA)$/.test((e.target.tagName || ""))) return;
    if (e.key === "+" || e.key === "=") zoomAt(W / 2, H / 2, 0.8);
    if (e.key === "-" || e.key === "_") zoomAt(W / 2, H / 2, 1.25);
    if (e.key === "0") { S.view = { xmin: -8, xmax: 8, ymin: -4.5, ymax: 4.5 }; if (S.aspect) applyAspect(); draw(); persist(); }
    if (e.key === "Delete" || e.key === "Backspace") {
      if (S.exprs[S.sel]) { S.exprs.splice(S.sel, 1); if (S.sel >= S.exprs.length) S.sel = S.exprs.length - 1; afterChange(); }
    }
  });

  window.addEventListener("resize", resize);

  function boot() {
    setMode("explicit");
    renderChips();
    renderGallery();
    var loaded = false;
    if (location.hash && location.hash.indexOf("#s=") === 0) {
      try { loaded = loadSnap(JSON.parse(decodeURIComponent(location.hash.slice(3)))); } catch (e) { loaded = false; }
    }
    if (!loaded) {
      try { loaded = loadSnap(JSON.parse(localStorage.getItem(STORE) || "null")); } catch (e) { loaded = false; }
    }
    if (!loaded || !S.exprs.length) {
      addExpr({ kind: "explicit", src: "sin(x)" });
      S.pi = false;
    }
    var savedTheme = S.theme;
    try {
      var raw = JSON.parse(localStorage.getItem(STORE) || "{}");
      if (raw && raw.o && raw.o.theme) savedTheme = raw.o.theme;
    } catch (e) {}
    if (document.documentElement.dataset.theme === "dark") savedTheme = "dark";
    setTheme(savedTheme, true);
    renderTools();
    renderList();
    resize();
    renderInfo();
    if (window.Motion) {
      Motion.pills([{ sel: "#modes" }, { sel: "#tools", keep: true }]);
      Motion.enter($(".stage"));
    }
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("sw.js");
    }
  }
  boot();
})();
