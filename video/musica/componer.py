"""Música original para el video de Rumbo Traveling (sin derechos de terceros: se genera acá).
60 s, 110 BPM, acordes Do - Sol - Lam - Fa. Colchón suave, arpegio, bajo y percusión liviana.
Uso: python3 componer.py salida.wav
"""
import sys
import wave
import numpy as np

SR = 44100
BPM = 110
DUR = 60.0
BEAT = 60 / BPM
N = int(SR * DUR)
t_total = np.arange(N) / SR
rng = np.random.default_rng(7)


def nota(n):  # número MIDI -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)


ACORDES = [  # (raíz del bajo, notas del acorde)
    (36, [60, 64, 67, 72]),  # Do
    (43, [59, 62, 67, 71]),  # Sol
    (45, [57, 60, 64, 69]),  # Lam
    (41, [57, 60, 65, 69]),  # Fa
]

izq = np.zeros(N)
der = np.zeros(N)


def sumar(señal, inicio, pan=0.0, vol=1.0):
    i = int(inicio * SR)
    if i >= N:
        return
    s = señal[: N - i] * vol
    izq[i : i + len(s)] += s * (1 - pan) / 2 * 2 ** 0.5 * 0.7071
    der[i : i + len(s)] += s * (1 + pan) / 2 * 2 ** 0.5 * 0.7071


def envolvente(largo, ataque, caida):
    t = np.arange(int(largo * SR)) / SR
    env = np.minimum(1, t / max(ataque, 1e-4)) * np.exp(-t / caida)
    return t, env


def pasabajos(x, corte):
    a = np.exp(-2 * np.pi * corte / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):  # filtro de un polo
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


compas = 4 * BEAT
compases = int(DUR / compas) + 1
fin_bateria = DUR - 6.5  # el final queda solo con colchón y arpegio

for c in range(compases):
    inicio = c * compas
    raiz, notas = ACORDES[c % 4]
    # Colchón: acorde sostenido, ataque lento
    largo = compas + 0.4
    t, env = envolvente(largo, 0.6, 3.5)
    pad = sum(np.sin(2 * np.pi * nota(n) * t) + 0.25 * np.sin(2 * np.pi * nota(n) * 2.003 * t) for n in notas[:3])
    sumar(pad * env * 0.05, inicio, pan=-0.2)
    # Arpegio en corcheas (desde el compás 2)
    if c >= 1:
        patron = [0, 1, 2, 3, 2, 1, 2, 3]
        for k, idx in enumerate(patron):
            tt, e = envolvente(0.5, 0.004, 0.18)
            f = nota(notas[idx] + 12)
            pluck = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt) + 0.1 * np.sin(6 * np.pi * f * tt)) * e
            sumar(pluck * 0.06, inicio + k * BEAT / 2, pan=0.35 if k % 2 else -0.1)
    # Bajo en el 1 y el 3 (desde el compás 2)
    if c >= 1 and inicio < DUR - 3:
        for b in (0, 2, 2.5):
            tt, e = envolvente(BEAT * 1.2, 0.01, 0.35)
            f = nota(raiz)
            sumar((np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(4 * np.pi * f * tt)) * e * 0.16, inicio + b * BEAT)
    # Percusión (desde el compás 3 hasta el final)
    if 2 <= c and inicio < fin_bateria:
        for b in range(4):
            tt, e = envolvente(0.35, 0.001, 0.09)
            f = 110 * np.exp(-tt * 18) + 45
            bombo = np.sin(2 * np.pi * np.cumsum(f) / SR) * e
            sumar(bombo * 0.33, inicio + b * BEAT)
            # Platillo en los contratiempos
            ruido = rng.standard_normal(int(0.08 * SR))
            ruido = ruido - pasabajos(ruido, 6000)
            _, eh = envolvente(0.08, 0.001, 0.025)
            sumar(ruido * eh * 0.03, inicio + (b + 0.5) * BEAT, pan=0.3)
        # Aplauso suave en el 2 y el 4
        for b in (1, 3):
            ruido = rng.standard_normal(int(0.2 * SR))
            ruido = pasabajos(ruido, 3500) - pasabajos(ruido, 900)
            _, ec = envolvente(0.2, 0.002, 0.06)
            sumar(ruido * ec * 0.07, inicio + b * BEAT, pan=-0.15)

# Eco suave (como una sala)
for canal in (izq, der):
    d = int(SR * BEAT * 0.75)
    eco = np.zeros_like(canal)
    eco[d:] = canal[:-d] * 0.25
    eco[2 * d :] += canal[: -2 * d] * 0.1
    canal += eco

estereo = np.stack([izq, der], axis=1)
# Entrada y salida en fundido
estereo *= np.clip(t_total / 1.5, 0, 1)[:, None]
estereo *= np.clip((DUR - t_total) / 3.5, 0, 1)[:, None]
estereo /= np.max(np.abs(estereo)) / 0.85  # pico en -1,4 dB
datos = (estereo * 32767).astype(np.int16)

with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(datos.tobytes())
print("listo", sys.argv[1], f"{DUR:.0f} s")
