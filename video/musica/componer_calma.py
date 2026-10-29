"""Música original tranquila para Shorts (sin derechos de terceros: se genera acá).
Mismo estilo que componer.py (colchón, arpegio, bajo), pero más lenta, sin batería fuerte
y con un tema distinto por video.
Uso: python3 componer_calma.py <tema> salida.wav     (temas: miami, ranking, concurso)
"""
import sys
import wave
import numpy as np

SR = 44100
DUR = 40.0
N = int(SR * DUR)


def nota(n):  # número MIDI -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)


TEMAS = {
    # Miami: piano eléctrico tibio, aire de playa al atardecer. Fa maj7 - Mi m7 - Re m7 - Do maj7.
    "miami": {
        "bpm": 84,
        "semilla": 11,
        "acordes": [
            (41, [57, 60, 64, 65]),
            (40, [55, 59, 62, 64]),
            (38, [53, 57, 60, 62]),
            (36, [52, 55, 59, 60]),
        ],
        "arpegio": [0, 2, 1, 3, 2, 1, 3, 2],
        "timbre": "piano",
        "melodia": [72, None, 71, 69, None, 67, 69, None, 64, None, 65, 67, None, 64, 62, None],
        "shaker": True,
    },
    # Ranking: guitarra punteada suave, curiosa y optimista. La m7 - Re m9 - Sol - Do maj7.
    "ranking": {
        "bpm": 92,
        "semilla": 23,
        "acordes": [
            (45, [57, 60, 64, 67]),
            (38, [53, 57, 60, 64]),
            (43, [55, 59, 62, 67]),
            (36, [55, 59, 60, 64]),
        ],
        "arpegio": [0, 1, 2, 3, 2, 3, 1, 2],
        "timbre": "guitarra",
        "melodia": [76, None, 74, None, 72, 74, None, 71, 72, None, None, 67, 69, None, 71, None],
        "shaker": False,
    },
    # Concurso: guitarra punteada con más ilusión, en Re. Re - La - Si m7 - Sol maj7.
    "concurso": {
        "bpm": 96,
        "semilla": 41,
        "acordes": [
            (38, [57, 62, 66, 69]),
            (45, [57, 61, 64, 69]),
            (47, [57, 59, 62, 66]),
            (43, [55, 59, 62, 66]),
        ],
        "arpegio": [0, 2, 1, 3, 1, 2, 3, 2],
        "timbre": "guitarra",
        "melodia": [78, None, 76, 74, None, 76, 78, None, 81, None, 78, 76, None, 74, 73, None],
        "shaker": True,
    },
}

tema = TEMAS[sys.argv[1]]
BEAT = 60 / tema["bpm"]
rng = np.random.default_rng(tema["semilla"])
izq = np.zeros(N)
der = np.zeros(N)


def sumar(señal, inicio, pan=0.0):
    i = int(inicio * SR)
    if i >= N:
        return
    s = señal[: N - i]
    izq[i : i + len(s)] += s * np.sqrt((1 - pan) / 2)
    der[i : i + len(s)] += s * np.sqrt((1 + pan) / 2)


def envolvente(largo, ataque, caida):
    t = np.arange(int(largo * SR)) / SR
    return t, np.minimum(1, t / max(ataque, 1e-4)) * np.exp(-t / caida)


def piano(f, largo):  # piano eléctrico: parciales con algo de campana y trémolo lento
    t, e = envolvente(largo, 0.008, 0.9)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3) + 0.12 * np.sin(2 * np.pi * 7.01 * f * t) * np.exp(-t * 12)
    return s * e * (1 + 0.12 * np.sin(2 * np.pi * 4.5 * t))


def guitarra(f, largo):  # cuerda punteada (Karplus-Strong)
    n = int(largo * SR)
    p = int(SR / f)
    buf = rng.uniform(-1, 1, p)
    buf = np.convolve(buf, np.ones(4) / 4, mode="same")
    out = np.empty(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.497 * (buf[i % p] + buf[(i + 1) % p])
    return out * np.minimum(1, np.arange(n) / 40)


instrumento = piano if tema["timbre"] == "piano" else guitarra
compas = 4 * BEAT
compases = int(DUR / compas) + 1

for c in range(compases):
    inicio = c * compas
    raiz, notas = tema["acordes"][c % 4]
    # Colchón: acorde sostenido con ataque lento, durante todo el tema
    t, env = envolvente(compas + 0.8, 1.2, 4.0)
    pad = sum(np.sin(2 * np.pi * nota(n) * t) + 0.2 * np.sin(2 * np.pi * nota(n) * 1.997 * t) for n in notas)
    sumar(pad * env * 0.035, inicio, pan=-0.25)
    # Arpegio suave (desde el compás 2)
    if c >= 1:
        for k, idx in enumerate(tema["arpegio"]):
            sumar(instrumento(nota(notas[idx] + 12), 1.4) * 0.05, inicio + k * BEAT / 2, pan=0.3 if k % 2 else -0.1)
    # Bajo redondo en el 1 (desde el compás 2)
    if c >= 1 and inicio < DUR - 3:
        for b in (0, 2.5):
            tt, e = envolvente(BEAT * 1.8, 0.02, 0.6)
            sumar(np.sin(2 * np.pi * nota(raiz) * tt) * e * 0.14, inicio + b * BEAT)
    # Melodía (compases 3 a 6 y 9 a 12), una nota por corchea
    if 2 <= c % 8 <= 5 and inicio < DUR - 4:
        mitad = (c % 2) * 8
        for k, n in enumerate(tema["melodia"][mitad : mitad + 8]):
            if n is not None:
                sumar(instrumento(nota(n), 1.8) * 0.07, inicio + k * BEAT / 2, pan=0.1)
    # Percusión muy liviana: solo un shaker o un golpe de bombo blando
    if 2 <= c and inicio < DUR - 5:
        for b in range(4):
            if tema["shaker"]:
                ruido = rng.standard_normal(int(0.07 * SR))
                ruido = np.diff(ruido, prepend=0)
                _, eh = envolvente(0.07, 0.01, 0.02)
                sumar(ruido * eh * (0.018 if b % 2 else 0.01), inicio + (b + 0.5) * BEAT, pan=0.4)
            elif b in (0, 2):
                tt, e = envolvente(0.3, 0.002, 0.1)
                f = 80 * np.exp(-tt * 15) + 42
                sumar(np.sin(2 * np.pi * np.cumsum(f) / SR) * e * 0.16, inicio + b * BEAT)

# Eco suave (como una sala)
for canal in (izq, der):
    d = int(SR * BEAT * 0.75)
    eco = np.zeros_like(canal)
    eco[d:] = canal[:-d] * 0.3
    eco[2 * d :] += canal[: -2 * d] * 0.12
    canal += eco

estereo = np.stack([izq, der], axis=1)
t_total = np.arange(N) / SR
estereo *= np.clip(t_total / 2.0, 0, 1)[:, None]
estereo *= np.clip((DUR - t_total) / 4.0, 0, 1)[:, None]
estereo /= np.max(np.abs(estereo)) / 0.85
datos = (estereo * 32767).astype(np.int16)

with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(datos.tobytes())
print("listo", sys.argv[2], f"{DUR:.0f} s")
