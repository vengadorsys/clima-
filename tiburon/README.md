# Tiburón dorado nadando (video generado por código)

`tiburon_nadando.mp4`: 1080x1920, 30 fps, 10 s, H.264 yuv420p, crf 18.

```bash
pip install opencv-python-headless numpy scipy   # + ffmpeg en el sistema
python3 generar_video.py                         # nadador dibujado por código
python3 generar_video.py --nadador foto.jpg      # usa la silueta blanca de esa imagen
python3 generar_video.py --qc                    # solo máscara, fondo y tira de control
```

- `tiburon_base.jpg`: imagen base (tiburón recto, cola curvada a la izquierda).
- `qc/`: máscara + columna vertebral + aletas separadas, fondo reconstruido y
  tira de 6 fotogramas clave para revisar.

Técnica: segmentación por color + relleno de contornos; fondo reconstruido por
convolución normalizada; columna vertebral = línea media de la máscara; el cuerpo
se deforma en coordenadas curvilíneas (s, n) a lo largo de esa columna, que se
reconstruye integrando ángulos (onda cabeza→cola a 0.5 Hz, sin estirar); aletas
pectorales como capas rígidas con ±4°; rumbo que sigue la curva, avance con
easing y +13 % de escala; cáusticas, sombra, partículas, motion blur en la cola,
grano, viñeta y fundidos.
