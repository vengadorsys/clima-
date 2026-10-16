#!/usr/bin/env python3
"""
Tiburón dorado nadando hacia un nadador (vista cenital).

Genera tiburon_nadando.mp4 (1080x1920, 30 fps, 10 s, H.264 yuv420p crf 18)
a partir de una imagen fija del tiburón usando Python + OpenCV + NumPy + ffmpeg.

Uso:
    python3 generar_video.py                      # nadador generado por código
    python3 generar_video.py --nadador foto.jpg   # extrae la silueta blanca de esa imagen
    python3 generar_video.py --qc                 # solo exporta máscara, columna y tira QC

Pipeline:
  1. Segmentación del tiburón por color (dorado vs. azul marino) + relleno de
     contornos + borde suavizado.
  2. Fondo reconstruido sin el tiburón (convolución normalizada = inpainting
     suave que conserva color y viñeta del original) + textura sutil.
  3. Columna vertebral = línea media de la máscara (cabeza→cola), re-muestreada
     por longitud de arco. Cada píxel del tiburón se expresa en coordenadas
     curvilíneas (s, n) respecto a la columna.
  4. Animación esquelética: la columna se reconstruye integrando ángulos
     (no se estira), con una onda que viaja de la cabeza a la cola. El cuerpo se
     deforma con esa malla curvilínea (inversa exacta por punto más cercano).
  5. Aletas pectorales recortadas como capas rígidas que siguen al cuerpo y
     rotan ±4° de forma independiente.
"""
import argparse
import os
import subprocess
import sys

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS, DUR = 1080, 1920, 30, 10.0
NF = int(FPS * DUR)
K = 0.8                      # escala de trabajo de la imagen fuente (1536 -> 1229 px)
RNG = np.random.default_rng(7)


def smoothstep(a, b, x):
    x = np.clip((x - a) / (b - a), 0.0, 1.0)
    return x * x * (3 - 2 * x)


def rot(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, -s], [s, c]], np.float32)


# --------------------------------------------------------------------------
# 1. Segmentación del tiburón
# --------------------------------------------------------------------------
def shark_mask(img):
    f = img.astype(np.float32)
    b, _, r = cv2.split(f)
    m = (((r - b) > 2) & (r > 18)).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    m = (lab == i).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE,
                         cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    full = np.zeros_like(m)
    cv2.drawContours(full, cs, -1, 255, -1)          # sin huecos
    return full


# --------------------------------------------------------------------------
# 2. Columna vertebral
# --------------------------------------------------------------------------
def compute_spine(mask):
    """Línea media cabeza→cola (coords de la imagen) re-muestreada a 1 px."""
    m = mask > 0
    dt = cv2.distanceTransform(m.astype(np.uint8), cv2.DIST_L2, 5)
    ys = np.where(m.any(1))[0]
    y0, y1 = ys[0] + 4, ys[-1] - 2
    pts, prev = [], None
    for y in range(y0, y1 + 1):
        xs = np.where(m[y])[0]
        runs = np.split(xs, np.where(np.diff(xs) > 1)[0] + 1)
        if prev is None:
            run = max(runs, key=len)
        else:   # el tramo que sigue a la columna (descarta el lóbulo inferior de la cola)
            run = min(runs, key=lambda r: 0 if r[0] <= prev <= r[-1]
                      else min(abs(r[0] - prev), abs(r[-1] - prev)))
        w = dt[y, run] ** 3 + 1e-6
        cx = float((w * run).sum() / w.sum())
        pts.append((cx, y))
        prev = cx
    pts = np.array(pts, np.float64)
    pts[:, 0] = gaussian_filter1d(pts[:, 0], 55, mode="nearest")
    # re-muestreo por longitud de arco
    seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    L = seg[-1]
    s = np.arange(0, L, 1.0)
    sp = np.stack([np.interp(s, seg, pts[:, 0]), np.interp(s, seg, pts[:, 1])], 1)
    return sp


def extend_spine(sp, head_ext, tail_ext):
    t0 = sp[0] - sp[6]; t0 /= np.linalg.norm(t0)
    t1 = sp[-1] - sp[-7]; t1 /= np.linalg.norm(t1)
    head = sp[0] + t0 * np.arange(head_ext, 0, -1)[:, None]
    tail = sp[-1] + t1 * np.arange(1, tail_ext + 1)[:, None]
    return np.vstack([head, sp, tail])


def tangents(sp):
    g = np.gradient(sp, axis=0)
    g = gaussian_filter1d(g, 6, axis=0, mode="nearest")
    return np.arctan2(g[:, 1], g[:, 0])


# --------------------------------------------------------------------------
# Preparación de capas
# --------------------------------------------------------------------------
class Assets:
    pass


def prepare(base_path, qc_dir=None):
    A = Assets()
    full = cv2.imread(base_path)
    mfull = shark_mask(full)
    spine_full = compute_spine(mfull)

    src = cv2.resize(full, None, fx=K, fy=K, interpolation=cv2.INTER_AREA)
    m = cv2.resize(mfull, (src.shape[1], src.shape[0]), interpolation=cv2.INTER_AREA)
    m = (m > 127).astype(np.uint8) * 255
    hs, ws = m.shape
    # borde: se come 1 px del contorno oscuro y se suaviza
    m_er = cv2.erode(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    alpha = cv2.GaussianBlur(m_er.astype(np.float32) / 255, (0, 0), 0.9)

    # Columna en escala K
    sp = spine_full * K
    seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(sp, axis=0), axis=1))]
    s = np.arange(0, seg[-1], 1.0)
    sp = np.stack([np.interp(s, seg, sp[:, 0]), np.interp(s, seg, sp[:, 1])], 1)
    A.L = len(sp)
    A.HEAD_EXT, A.TAIL_EXT = 40, 60
    A.spine0 = extend_spine(sp, A.HEAD_EXT, A.TAIL_EXT)
    A.theta0 = tangents(A.spine0)
    A.u = (np.arange(len(A.spine0)) - A.HEAD_EXT) / A.L      # 0 = hocico, 1 = cola

    # ---- aletas pectorales -------------------------------------------------
    mb = m > 0
    rows = np.where(mb.any(1))[0]
    left = np.full(hs, np.nan); right = np.full(hs, np.nan)
    for y in rows:
        xs = np.where(mb[y])[0]
        left[y], right[y] = xs[0], xs[-1]
    width = right - left
    yy = np.arange(hs)
    # filas donde el ancho salta = aletas
    ok = ~np.isnan(width)
    body_w = cv2.morphologyEx(np.nan_to_num(width).astype(np.float32)[:, None], cv2.MORPH_OPEN,
                              np.ones((161, 1), np.uint8))[:, 0]
    fin_rows = np.where(ok & (width > body_w + 30))[0]
    fin_rows = fin_rows[(fin_rows > rows[0] + 0.3 * (rows[-1] - rows[0])) &
                        (fin_rows < rows[0] + 0.6 * (rows[-1] - rows[0]))]
    fy0, fy1 = fin_rows.min() - 14, fin_rows.max() + 14
    lb = np.copy(left); rb = np.copy(right)
    for arr in (lb, rb):        # borde del cuerpo interpolado bajo las aletas (curva suave)
        ya, yb = fy0 - 30, fy1 + 30
        ka = np.polyfit(np.arange(ya - 40, ya), arr[ya - 40:ya], 1)
        kb = np.polyfit(np.arange(yb, yb + 40), arr[yb:yb + 40], 1)
        y_ = np.arange(ya, yb + 1)
        tt = (y_ - ya) / (yb - ya)
        h00 = 2 * tt**3 - 3 * tt**2 + 1; h10 = tt**3 - 2 * tt**2 + tt
        h01 = -2 * tt**3 + 3 * tt**2; h11 = tt**3 - tt**2
        arr[ya:yb + 1] = (h00 * arr[ya] + h10 * (yb - ya) * ka[0] +
                          h01 * arr[yb] + h11 * (yb - ya) * kb[0])
    XX = np.arange(ws)[None, :]
    band = (yy >= fy0 - 30) & (yy <= fy1 + 30)
    finL = np.zeros((hs, ws), bool); finR = np.zeros((hs, ws), bool)
    finL[band] = XX < lb[band][:, None]
    finR[band] = XX > rb[band][:, None]
    finL &= mb; finR &= mb
    # cuerpo = máscara sin aletas, corte con borde suave de 1.5 px
    cut = np.zeros((hs, ws), np.float32)
    cut[band] = np.clip(np.minimum(XX - lb[band][:, None], rb[band][:, None] - XX) + 0.5, 0, 1)
    cut[~band] = 1
    cut = cv2.GaussianBlur(cut, (0, 0), 0.8)
    A.body_alpha = alpha * cut
    srcf = src.astype(np.float32)
    A.src = srcf
    A.body_rgba = np.dstack([srcf * A.body_alpha[..., None], A.body_alpha])

    A.fins = []
    for side, fm, edge in (("L", finL, lb), ("R", finR, rb)):
        # la aleta entra 22 px bajo el cuerpo (queda oculta) para que al girar no abra huecos
        ext = np.zeros((hs, ws), bool)
        sgn = -1 if side == "L" else 1
        ext[band] = (sgn * (XX - edge[band][:, None]) > -22)
        # la tira bajo el cuerpo solo en las filas donde nace la aleta
        root = np.array([fm[y, int(np.clip(edge[y] + sgn * 3, 0, ws - 1))] if not np.isnan(edge[y]) else False
                         for y in range(hs)])
        ry_ = np.where(root)[0]
        ext[:ry_.min() + 4] = False
        ext[ry_.max() - 4:] &= fm[ry_.max() - 4:]
        ext |= fm
        reg = ext & mb
        fa = alpha * reg.astype(np.float32)
        fa = cv2.GaussianBlur(fa, (0, 0), 0.6) * mb
        # oclusión ambiental en la raíz: oscurece la aleta donde nace del cuerpo
        dist = np.zeros((hs, ws), np.float32)
        dist[band] = np.clip(sgn * (XX - edge[band][:, None]), 0, 60) / 60.0
        ao = 0.80 + 0.20 * smoothstep(0, 0.35, dist)
        ys_, xs_ = np.where(fm)
        root_y = ys_.mean()
        ry = int(round(root_y))
        pivot = np.array([edge[ry] - sgn * 6, root_y], np.float32)
        x0, x1 = xs_.min() - 40, xs_.max() + 40
        y0, y1 = ys_.min() - 40, ys_.max() + 40
        x0, x1 = max(0, x0 - 30 * (side == "R")), min(ws, x1 + 30 * (side == "L"))
        rgba = np.dstack([srcf * (fa * ao)[..., None], fa])[y0:y1, x0:x1]
        A.fins.append(dict(side=side, rgba=np.ascontiguousarray(rgba), off=np.array([x0, y0], np.float32),
                           pivot=pivot, phase=0.0 if side == "L" else 2.1))
    A.fin_rows = (fy0, fy1)

    # semi-anchura del cuerpo a cada lado de la columna (para validar el mapa inverso)
    ys_, xs_ = np.where(A.body_alpha > 0.02)
    pp = np.stack([xs_, ys_], 1).astype(np.float64)
    _, ii = cKDTree(A.spine0).query(pp, workers=-1)
    T0 = np.stack([np.cos(A.theta0), np.sin(A.theta0)], 1)[ii]
    nn = ((pp - A.spine0[ii]) * np.stack([-T0[:, 1], T0[:, 0]], 1)).sum(1)
    npos = np.zeros(len(A.spine0)); nneg = np.zeros(len(A.spine0))
    np.maximum.at(npos, ii, nn); np.minimum.at(nneg, ii, nn)
    from scipy.ndimage import maximum_filter1d, minimum_filter1d
    A.npos = maximum_filter1d(npos, 25) + 6
    A.nneg = minimum_filter1d(nneg, 25) - 6

    # ---- fondo sin tiburón (salida 1080x1920) ------------------------------
    sc = W / full.shape[1]
    bg = cv2.resize(full, (W, int(round(full.shape[0] * sc))), interpolation=cv2.INTER_AREA)
    mo = cv2.resize(mfull, (bg.shape[1], bg.shape[0]), interpolation=cv2.INTER_NEAREST)
    oy = (bg.shape[0] - H) // 2
    bg = bg[oy:oy + H].astype(np.float32)
    mo = mo[oy:oy + H]
    keep = (cv2.dilate(mo, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41))) == 0).astype(np.float32)
    small = lambda a: cv2.resize(a, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    num = cv2.GaussianBlur(small(bg * keep[..., None]), (0, 0), 30)
    den = cv2.GaussianBlur(small(keep), (0, 0), 30)[..., None]
    smooth = cv2.resize(num / np.maximum(den, 1e-4), (W, H), interpolation=cv2.INTER_CUBIC)
    # textura sutil (grano estático del original, generado con la misma amplitud)
    tex = RNG.normal(0, 1, (H, W)).astype(np.float32)
    tex = cv2.GaussianBlur(tex, (0, 0), 0.7) * 1.6
    keep_s = cv2.GaussianBlur(keep, (0, 0), 6)[..., None]
    bg_clean = smooth + tex[..., None]
    A.bg = keep_s * bg + (1 - keep_s) * bg_clean
    A.bg = np.clip(A.bg, 0, 255)
    A.out_scale0 = sc / K            # px salida por px fuente(K) a escala 1

    if qc_dir:
        os.makedirs(qc_dir, exist_ok=True)
        vis = src.copy()
        red = np.zeros_like(vis); red[:] = (30, 30, 200)
        a3 = A.body_alpha[..., None]
        for fdict, col in zip(A.fins, ((200, 120, 0), (0, 160, 0))):
            pass
        vis = (src * a3 + red * (1 - a3)).astype(np.uint8)
        for f_, col in zip((finL, finR), ((255, 160, 0), (0, 200, 0))):
            vis[f_] = (0.5 * vis[f_] + 0.5 * np.array(col)).astype(np.uint8)
        for p in A.spine0[::4]:
            cv2.circle(vis, (int(p[0]), int(p[1])), 2, (255, 255, 255), -1)
        for f in A.fins:
            cv2.circle(vis, tuple(int(v) for v in f["pivot"]), 7, (0, 255, 255), -1)
        cv2.imwrite(os.path.join(qc_dir, "qc_mascara_columna.jpg"), vis)
        cv2.imwrite(os.path.join(qc_dir, "qc_fondo_limpio.jpg"), A.bg.astype(np.uint8))
    return A


# --------------------------------------------------------------------------
# Animación del tiburón
# --------------------------------------------------------------------------
TAIL_F = 0.5          # ciclos de coletazo por segundo
REST_CURL = 0.7       # cuánto de la curva original de la cola se conserva


def wave(A, t):
    """Perturbación angular de la columna: onda cabeza→cola, amplitud creciente."""
    u = A.u
    uc = np.clip(u, 0, 1.05)
    amp = 0.30 * smoothstep(0.10, 1.0, uc) ** 1.3 + 0.16 * smoothstep(0.78, 1.0, uc)
    return amp * np.sin(2 * np.pi * (uc / 0.95 - TAIL_F * t))


def deformed_spine(A, t):
    th0 = A.theta0
    i0 = A.HEAD_EXT
    th_h = th0[i0]
    th = th_h + REST_CURL * (th0 - th_h) + wave(A, t)
    d = np.stack([np.cos(th), np.sin(th)], 1)
    c = np.cumsum(d, axis=0)
    c = c - c[i0] + A.spine0[i0]           # el hocico queda anclado
    return c, th


def ease(x):
    return 0.5 - 0.5 * np.cos(np.pi * np.clip(x, 0, 1))


def global_pose(A, t):
    """Escala, rumbo y posición del tiburón en la salida."""
    e = ease(t / DUR)
    sigma = A.out_scale0 * (1.0 + 0.13 * e)
    # el rumbo sigue la curva del cuerpo (con un pequeño retraso)
    wv = wave(A, t - 0.25)
    sel = (A.u > 0.3) & (A.u < 1.0)
    bend = float(wv[sel].mean())
    path_x = 14 * np.sin(2 * np.pi * t / 9.0 + 0.6)
    dpx = 14 * 2 * np.pi / 9.0 * np.cos(2 * np.pi * t / 9.0 + 0.6)
    head_y0, head_y1 = 860.0, 395.0
    head_y = head_y0 + (head_y1 - head_y0) * e
    vy = (head_y1 - head_y0) * np.pi / (2 * DUR) * np.sin(np.pi * t / DUR) - 1e-3
    psi = 0.40 * bend + np.arctan(dpx / max(-vy, 60.0)) * 0.6
    return sigma, psi, np.array([540.0 + path_x, head_y], np.float32)


def shark_transform(A, t):
    """Devuelve (spine', theta', M) con M: local deformado -> salida."""
    c, th = deformed_spine(A, t)
    sigma, psi, head_out = global_pose(A, t)
    piv = A.HEAD_EXT + int(0.28 * A.L)
    P = c[piv]
    R = rot(psi) * sigma
    head_local = c[A.HEAD_EXT]
    # O tal que el hocico caiga en head_out (en x seguimos la trayectoria, en y la altura)
    O = head_out - R @ (head_local - P)
    M = np.zeros((2, 3), np.float32)
    M[:, :2] = R
    M[:, 2] = O - R @ P
    return c, th, M


class BodyRenderer:
    def __init__(self, A):
        self.A = A
        self.bx = (0, W); self.by = (0, H)
        self.hs, self.ws = A.body_alpha.shape

    def render(self, t, need_u=False):
        A = self.A
        c, th, M = shark_transform(A, t)
        Mi = cv2.invertAffineTransform(M)
        # bbox en salida del tiburón deformado
        pts = (M[:, :2] @ c.T).T + M[:, 2]
        pad = 260 * M[0, 0] if abs(M[0, 0]) > 0.1 else 260
        x0 = int(max(0, pts[:, 0].min() - 240)); x1 = int(min(W, pts[:, 0].max() + 240))
        y0 = int(max(0, pts[:, 1].min() - 120)); y1 = int(min(H, pts[:, 1].max() + 120))
        # mapa inverso a media resolución
        step = 2
        gx, gy = np.meshgrid(np.arange(x0, x1, step, dtype=np.float32),
                             np.arange(y0, y1, step, dtype=np.float32))
        lx = Mi[0, 0] * gx + Mi[0, 1] * gy + Mi[0, 2]
        ly = Mi[1, 0] * gx + Mi[1, 1] * gy + Mi[1, 2]
        q = np.stack([lx.ravel(), ly.ravel()], 1)
        tree = cKDTree(c)
        dist, idx = tree.query(q, workers=-1, distance_upper_bound=175)
        far = ~np.isfinite(dist)
        idx = np.where(far, 0, idx)
        T1 = np.stack([np.cos(th), np.sin(th)], 1)[idx]
        N1 = np.stack([-T1[:, 1], T1[:, 0]], 1)
        dv = q - c[idx]
        tt = (dv * T1).sum(1); nn = (dv * N1).sum(1)
        T0 = np.stack([np.cos(A.theta0), np.sin(A.theta0)], 1)[idx]
        N0 = np.stack([-T0[:, 1], T0[:, 0]], 1)
        srcp = A.spine0[idx] + tt[:, None] * T0 + nn[:, None] * N0
        bad = far | (nn > A.npos[idx]) | (nn < A.nneg[idx])
        sh = gx.shape
        mx = srcp[:, 0].reshape(sh).astype(np.float32)
        my = srcp[:, 1].reshape(sh).astype(np.float32)
        # validez: fuera del cuerpo o en una costura del eje medial (salto del mapa) -> 0
        valid = ~bad.reshape(sh)
        jump = np.zeros(sh, bool)
        v1 = valid[:, 1:] & valid[:, :-1]
        v0 = valid[1:, :] & valid[:-1, :]
        for m_ in (mx, my):
            d1 = (np.abs(np.diff(m_, axis=1)) > 8 * step) & v1
            d0 = (np.abs(np.diff(m_, axis=0)) > 8 * step) & v0
            jump[:, 1:] |= d1; jump[:, :-1] |= d1
            jump[1:, :] |= d0; jump[:-1, :] |= d0
        valid &= ~jump
        fw, fh = x1 - x0, y1 - y0
        mx = cv2.resize(mx, (fw, fh), interpolation=cv2.INTER_LINEAR)
        my = cv2.resize(my, (fw, fh), interpolation=cv2.INTER_LINEAR)
        vm = cv2.resize(valid.astype(np.float32), (fw, fh), interpolation=cv2.INTER_LINEAR)
        vm = np.clip((vm - 0.5) * 2, 0, 1)
        out = np.zeros((H, W, 4), np.float32)
        out[y0:y1, x0:x1] = cv2.remap(A.body_rgba, mx, my, cv2.INTER_LINEAR,
                                      borderMode=cv2.BORDER_CONSTANT, borderValue=0) * vm[..., None]
        uo = None
        if need_u:
            um = (A.u[idx]).reshape(sh).astype(np.float32)
            uo = np.zeros((H, W), np.float32)
            uo[y0:y1, x0:x1] = cv2.resize(um, (fw, fh), interpolation=cv2.INTER_LINEAR)
        return out, uo, (c, th, M)


def fin_flap(f, t):
    p = f["phase"]
    return np.deg2rad(4.0 * np.sin(2 * np.pi * 0.31 * t + p) + 1.2 * np.sin(2 * np.pi * 0.83 * t + 2 * p))


def render_fins(A, t, c, th, M):
    out = np.zeros((H, W, 4), np.float32)
    for f in A.fins:
        P = f["pivot"].astype(np.float64)
        d = np.linalg.norm(A.spine0 - P, axis=1)
        i = int(np.argmin(d))
        T0 = np.array([np.cos(A.theta0[i]), np.sin(A.theta0[i])])
        N0 = np.array([-T0[1], T0[0]])
        dv = P - A.spine0[i]
        tt, nn = dv @ T0, dv @ N0
        T1 = np.array([np.cos(th[i]), np.sin(th[i])]); N1 = np.array([-T1[1], T1[0]])
        Pd = c[i] + tt * T1 + nn * N1
        sgn = -1 if f["side"] == "L" else 1
        ang = (th[i] - A.theta0[i]) + sgn * fin_flap(f, t)
        Rl = rot(ang)
        # fuente(crop) -> fuente -> local deformado -> salida
        Ml = np.zeros((2, 3), np.float64)
        Ml[:, :2] = Rl
        Ml[:, 2] = Pd - Rl @ P + Rl @ f["off"]
        Mt = np.zeros((2, 3), np.float64)
        Mt[:, :2] = M[:, :2] @ Ml[:, :2]
        Mt[:, 2] = M[:, :2] @ Ml[:, 2] + M[:, 2]
        w = cv2.warpAffine(f["rgba"], Mt.astype(np.float32), (W, H), flags=cv2.INTER_LINEAR,
                           borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        out = w + out * (1 - w[..., 3:4])
    return out


# --------------------------------------------------------------------------
# Ambiente
# --------------------------------------------------------------------------
_cg = None


def caustics(t, scale=1.0):
    """Red de cáusticas animada (coordenadas de mundo, cámara fija)."""
    global _cg
    if _cg is None:
        gx, gy = np.meshgrid(np.arange(W // 4, dtype=np.float32), np.arange(H // 4, dtype=np.float32))
        _cg = (gx * 4 / 150.0, gy * 4 / 150.0)
    x, y = _cg
    acc = np.zeros_like(x)
    for k, (a, b, sp, ph) in enumerate(((1.0, 0.0, 0.55, 0.0), (0.5, 0.87, 0.47, 1.7),
                                        (-0.5, 0.87, 0.61, 3.1))):
        wx = x + 0.55 * np.sin(1.3 * y + t * 0.7 + ph)
        wy = y + 0.55 * np.sin(1.1 * x - t * 0.6 + 2 * ph)
        acc += np.sin((a * wx + b * wy) * 2.2 + t * sp * 2 * np.pi * 0.5 + ph)
    v = acc / 3.0
    cst = np.clip(1 - np.abs(v), 0, 1) ** 7
    cst = cv2.resize(cst, (W, H), interpolation=cv2.INTER_CUBIC)
    return np.clip(cv2.GaussianBlur(cst, (0, 0), 1.6), 0, 1)


class Particles:
    def __init__(self, n=170):
        r = np.random.default_rng(11)
        self.p0 = r.uniform([0, 0], [W, H], (n, 2))
        self.z = r.uniform(0, 1, n) ** 1.6               # 0 lejos, 1 cerca
        self.v = np.stack([r.normal(0, 3, n), r.uniform(-14, -4, n)], 1) * (0.4 + self.z[:, None])
        self.ph = r.uniform(0, 2 * np.pi, n, )
        self.fr = r.uniform(0.1, 0.35, n)
        self.br = r.uniform(0.35, 1.0, n)

    def render(self, t, front):
        lay = np.zeros((H, W), np.float32)
        sel = (self.z > 0.82) if front else (self.z <= 0.82)
        for i in np.where(sel)[0]:
            z = self.z[i]
            x = (self.p0[i, 0] + self.v[i, 0] * t + 9 * np.sin(2 * np.pi * self.fr[i] * t + self.ph[i])) % W
            y = (self.p0[i, 1] + self.v[i, 1] * t + 5 * np.sin(2 * np.pi * self.fr[i] * 0.7 * t + 2 * self.ph[i])) % H
            rad = 0.8 + 2.6 * z + (3.5 if front else 0)
            tw = 0.75 + 0.25 * np.sin(2 * np.pi * 0.6 * t + self.ph[i] * 3)
            cv2.circle(lay, (int(x * 4), int(y * 4)), int(rad * 4), float(self.br[i] * tw * (0.35 + 0.65 * z)),
                       -1, cv2.LINE_AA, 2)
        lay = cv2.GaussianBlur(lay, (0, 0), 2.2 if front else 0.9)
        return lay


# --------------------------------------------------------------------------
# Nadador
# --------------------------------------------------------------------------
SW_C = np.array([540.0, 268.0])
SS = 3                                   # supersampling del dibujo
SW_BOX = (620, 470)                      # lienzo local (px salida)


def _limb(img, pts, w0, w1, val):
    """Extremidad cónica (cápsula de grosor variable)."""
    pts = np.asarray(pts, np.float64)
    n = 14
    for k in range(len(pts) - 1):
        for j in range(n + 1):
            a = (k * n + j) / ((len(pts) - 1) * n)
            p = pts[k] + (pts[k + 1] - pts[k]) * j / n
            r = w0 + (w1 - w0) * a
            cv2.circle(img, (int(p[0] * SS), int(p[1] * SS)), int(r * SS), val, -1, cv2.LINE_AA)


def swimmer_silhouette(t):
    """Silueta blanca cenital de un nadador flotando (cabeza a la derecha)."""
    w, h = SW_BOX
    cx, cy = w / 2, h / 2
    above = np.zeros((h * SS, w * SS), np.uint8)
    below = np.zeros((h * SS, w * SS), np.uint8)
    sc = 2 * np.pi * 0.42 * t
    def P(x, y): return (cx + x, cy + y)
    # piernas (semi-sumergidas, más tenues) con aleteo suave
    for sgn, ph in ((1, 0.0), (-1, np.pi)):
        k = 5 * np.sin(2 * np.pi * 0.9 * t + ph)
        hip = P(-38, sgn * 17); knee = P(-125, sgn * (27 + k * 0.4)); foot = P(-205, sgn * (33 + k))
        _limb(below, [hip, knee, foot], 15, 8, 255)
        cv2.ellipse(below, (int(foot[0] * SS - 10 * SS), int(foot[1] * SS)), (14 * SS, 7 * SS),
                    0, 0, 360, 255, -1, cv2.LINE_AA)
    # brazos haciendo "sculling" lento
    for sgn, ph in ((1, 0.0), (-1, 0.6)):
        a = np.deg2rad(52 + 7 * np.sin(sc + ph))
        sh = np.array(P(88, sgn * 38))
        el = sh + 68 * np.array([np.cos(a), sgn * np.sin(a)])
        a2 = a - np.deg2rad(18 + 6 * np.sin(sc + ph + 0.8))
        hd = el + 62 * np.array([np.cos(a2), sgn * np.sin(a2)])
        _limb(above, [sh, el, hd], 12, 8, 255)
        cv2.circle(above, (int(hd[0] * SS), int(hd[1] * SS)), int(10 * SS), 255, -1, cv2.LINE_AA)
    # torso
    torso = np.array([P(100, 30), P(92, 44), P(60, 40), P(20, 30), P(-20, 32), P(-46, 26),
                      P(-46, -26), P(-20, -32), P(20, -30), P(60, -40), P(92, -44), P(100, -30)])
    cv2.fillPoly(above, [(torso * SS).astype(np.int32)], 255, cv2.LINE_AA)
    cv2.ellipse(above, (int(P(104, 0)[0] * SS), int(cy * SS)), (16 * SS, 22 * SS), 0, 0, 360, 255, -1, cv2.LINE_AA)
    cv2.ellipse(above, (int(P(130, 0)[0] * SS), int(cy * SS)), (25 * SS, 20 * SS), 0, 0, 360, 255, -1, cv2.LINE_AA)
    a_ = cv2.resize(above, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    b_ = cv2.resize(below, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    a_ = cv2.GaussianBlur(a_, (0, 0), 0.7)
    b_ = cv2.GaussianBlur(b_, (0, 0), 1.6)
    return np.maximum(a_ * 0.96, b_ * 0.62)


_splash = None


def splash_layer(t, sil):
    """Espuma y ondas alrededor del nadador (capa alfa local)."""
    global _splash
    w, h = SW_BOX
    if _splash is None:
        r = np.random.default_rng(5)
        edge = cv2.Canny((cv2.GaussianBlur(sil, (0, 0), 6) > 0.15).astype(np.uint8) * 255, 50, 150)
        ys, xs = np.where(edge > 0)
        sel = r.choice(len(xs), 140, replace=False)
        _splash = dict(p=np.stack([xs[sel], ys[sel]], 1).astype(np.float64),
                       ph=r.uniform(0, 1, 140), sp=r.uniform(0.35, 0.8, 140),
                       rad=r.uniform(2, 6.5, 140), dr=r.normal(0, 1, (140, 2)))
    S = _splash
    lay = np.zeros((h * 2, w * 2), np.float32)
    c = np.array([w / 2, h / 2])
    for i in range(len(S["p"])):
        life = (t * S["sp"][i] + S["ph"][i]) % 1.0
        d = S["p"][i] - c
        d = d / (np.linalg.norm(d) + 1e-6)
        pos = S["p"][i] + d * (4 + 26 * life) + S["dr"][i] * 6 * life
        a = np.sin(np.pi * life) ** 1.5 * 0.85
        rr = S["rad"][i] * (0.6 + 0.8 * life)
        cv2.circle(lay, (int(pos[0] * 2), int(pos[1] * 2)), max(1, int(rr * 2)), float(a), -1, cv2.LINE_AA)
    # patada: espuma extra en los pies
    for k in range(18):
        ph = (t * 1.3 + k / 18) % 1.0
        ang = k * 2.4
        pos = c + np.array([-215 - 22 * ph, 0]) + np.array([np.cos(ang), np.sin(ang)]) * (8 + 30 * ph)
        cv2.circle(lay, (int(pos[0] * 2), int(pos[1] * 2)), int((3 + 5 * ph) * 2),
                   float(0.7 * np.sin(np.pi * ph)), -1, cv2.LINE_AA)
    # ondas concéntricas
    for k in range(3):
        ph = (t / 3.2 + k / 3) % 1.0
        ax = (int((150 + 170 * ph) * 2), int((75 + 110 * ph) * 2))
        cv2.ellipse(lay, (int(c[0] * 2), int(c[1] * 2)), ax, 0, 0, 360,
                    float(0.30 * (1 - ph) ** 1.5), int(3 * 2), cv2.LINE_AA)
    lay = cv2.resize(lay, (w, h), interpolation=cv2.INTER_AREA)
    return np.clip(cv2.GaussianBlur(lay, (0, 0), 1.1), 0, 1)


def extract_swimmer(path, base_mask_path=None):
    """Extrae la silueta blanca del nadador (y su salpicadura) de una imagen,
    excluyendo cualquier píxel dorado del tiburón."""
    img = cv2.imread(path)
    img = cv2.resize(img, (W, int(round(img.shape[0] * W / img.shape[1]))), interpolation=cv2.INTER_AREA)
    oy = (img.shape[0] - H) // 2
    img = img[oy:oy + H].astype(np.float32)
    shark = cv2.resize(shark_mask(img.astype(np.uint8)), (W, H))
    shark = cv2.dilate(shark, np.ones((15, 15), np.uint8)) > 0
    mn = img.min(2); mx = img.max(2)
    white = np.clip((mn - 70) / 110, 0, 1) * np.clip(1 - (mx - mn) / 90, 0, 1)
    white[shark] = 0
    white[int(H * 0.45):] = 0
    lab = (white > 0.1).astype(np.uint8)
    n, l, st, cen = cv2.connectedComponentsWithStats(lab)
    if n < 2:
        raise SystemExit("No se encontró nadador en la imagen")
    big = 1 + int(np.argmax(st[1:, 4]))
    x, y, w_, h_ = st[big, :4]
    cxy = cen[big]
    # caja local centrada en el nadador
    bw, bh = SW_BOX
    x0, y0 = int(cxy[0] - bw / 2), int(cxy[1] - bh / 2)
    crop = np.zeros((bh, bw), np.float32)
    xs0, ys0 = max(0, x0), max(0, y0)
    xs1, ys1 = min(W, x0 + bw), min(H, y0 + bh)
    crop[ys0 - y0:ys1 - y0, xs0 - x0:xs1 - x0] = white[ys0:ys1, xs0:xs1]
    return crop, np.array(cxy)


# --------------------------------------------------------------------------
# Composición de un fotograma
# --------------------------------------------------------------------------
class Scene:
    def __init__(self, A, swimmer=None):
        self.A = A
        self.body = BodyRenderer(A)
        self.parts = Particles()
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H * 0.47) / (H * 0.60)) ** 2)
        self.vig = (1 - 0.55 * smoothstep(0.45, 1.25, r))[..., None]
        self.swimmer_img = swimmer
        if swimmer is not None:
            global SW_C
            SW_C = swimmer[1]

    def frame(self, t):
        A = self.A
        img = A.bg.copy()
        cst = caustics(t)
        img += (cst * 6.0)[..., None] * np.array([1.0, 0.95, 0.75], np.float32)  # luz muy tenue en el agua

        # partículas lejanas (detrás del tiburón)
        pb = self.parts.render(t, front=False)
        img += pb[..., None] * np.array([150, 160, 150], np.float32) * 0.55

        # tiburón con motion blur en la cola: 3 sub-fotogramas
        dt = 1.0 / FPS * 0.45
        body, u, (c, th, M) = self.body.render(t, need_u=True)
        bm, _, _ = self.body.render(t - dt)
        bp, _, _ = self.body.render(t + dt)
        wblur = smoothstep(0.55, 0.92, u)[..., None]
        body = body * (1 - wblur) + (bm + body + bp) / 3 * wblur
        fins = render_fins(A, t, c, th, M)
        shark = body + fins * (1 - body[..., 3:4])
        sa = shark[..., 3]

        # sombra suave debajo + brillo cálido alrededor
        e = ease(t / DUR)
        off = np.float32([[1, 0, 16 + 10 * e], [0, 1, 34 + 18 * e]])
        sh = cv2.warpAffine(sa, off, (W, H))
        sh = cv2.GaussianBlur(cv2.resize(sh, (W // 4, H // 4)), (0, 0), 7 + 3 * e)
        sh = cv2.resize(sh, (W, H))
        img *= (1 - 0.55 * sh)[..., None]
        glow = cv2.GaussianBlur(cv2.resize(sa, (W // 4, H // 4)), (0, 0), 14)
        glow = cv2.resize(glow, (W, H))
        img += (glow * 22)[..., None] * np.array([0.35, 0.75, 1.0], np.float32)

        # cáusticas sobre el dorado (se deslizan al moverse el tiburón)
        lit = 1.0 + 0.06 * e
        luma = shark[..., :3].mean(2) / np.maximum(sa, 1e-3)
        gold = np.array([120, 215, 255], np.float32)
        sh_rgb = shark[..., :3] * (lit + 0.45 * cst)[..., None]
        sh_rgb += (cst ** 1.4 * sa * (0.35 + luma / 255))[..., None] * gold * 0.55
        img = img * (1 - sa[..., None]) + sh_rgb

        # partículas cercanas (delante)
        pf = self.parts.render(t, front=True)
        img += pf[..., None] * np.array([170, 180, 170], np.float32) * 0.35

        # nadador
        a_sw = smoothstep(1.5, 2.7, t)
        if a_sw > 0:
            if self.swimmer_img is not None:
                sil = self.swimmer_img[0]
            else:
                sil = swimmer_silhouette(t)
            spl = splash_layer(t, sil)
            lay = np.maximum(sil, spl * 0.8)
            ang = 3.0 * np.sin(2 * np.pi * 0.21 * t) + 1.2 * np.sin(2 * np.pi * 0.47 * t + 1)
            dx = 4 * np.sin(2 * np.pi * 0.17 * t); dy = 3 * np.sin(2 * np.pi * 0.29 * t + 0.5)
            bw, bh = SW_BOX
            Mr = cv2.getRotationMatrix2D((bw / 2, bh / 2), ang, 1.0)
            Mr[:, 2] += SW_C + np.array([dx, dy]) - np.array([bw / 2, bh / 2])
            la = cv2.warpAffine(lay, Mr, (W, H)) * a_sw
            # sombra del nadador sobre el agua
            ls = cv2.GaussianBlur(cv2.warpAffine(sil, Mr, (W, H)), (0, 0), 10)
            ls = np.roll(ls, (14, 10), (0, 1)) * a_sw
            img *= (1 - 0.35 * ls)[..., None]
            img = img * (1 - la[..., None]) + la[..., None] * np.array([246, 248, 250], np.float32)

        # viñeta, grano, fundidos
        img *= self.vig
        g = np.random.default_rng(1000 + int(t * FPS)).normal(0, 1, (H // 2, W // 2)).astype(np.float32)
        g = cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR) * 3.2 + \
            np.random.default_rng(5000 + int(t * FPS)).normal(0, 1.6, (H, W)).astype(np.float32)
        img += g[..., None]
        fade = smoothstep(0.0, 0.9, t) * (1 - smoothstep(DUR - 0.9, DUR, t))
        img *= fade
        return np.clip(img, 0, 255).astype(np.uint8)


def contact_sheet(scene, path, times=(0.0 + 1.0, 2.5, 4.5, 6.5, 8.3, 9.4)):
    tiles = []
    for t in times:
        f = scene.frame(t)
        f = cv2.resize(f, (360, 640), interpolation=cv2.INTER_AREA)
        cv2.putText(f, f"t={t:.1f}s", (12, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2, cv2.LINE_AA)
        tiles.append(f)
    cv2.imwrite(path, np.hstack(tiles))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=os.path.join(HERE, "tiburon_base.jpg"))
    ap.add_argument("--nadador", default=None, help="imagen con la silueta del nadador (opcional)")
    ap.add_argument("--out", default=os.path.join(HERE, "tiburon_nadando.mp4"))
    ap.add_argument("--qc-dir", default=os.path.join(HERE, "qc"))
    ap.add_argument("--qc", action="store_true", help="solo control de calidad")
    args = ap.parse_args()

    A = prepare(args.base, args.qc_dir)
    sw = extract_swimmer(args.nadador) if args.nadador else None
    scene = Scene(A, sw)
    contact_sheet(scene, os.path.join(args.qc_dir, "qc_tira_fotogramas.jpg"))
    if args.qc:
        return

    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
           "-movflags", "+faststart", args.out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(NF):
        p.stdin.write(scene.frame(i / FPS).tobytes())
        if i % 30 == 0:
            print(f"fotograma {i}/{NF}", file=sys.stderr, flush=True)
    p.stdin.close()
    p.wait()
    print("listo:", args.out)


if __name__ == "__main__":
    main()
