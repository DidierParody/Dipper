---
title: Entendiendo el modelado de bases de datos
summary: Qué vamos a construir en esta serie, las tres fases del modelado y por qué todo empieza en el análisis del caso de estudio.
tags: [Bases de datos, Modelado de datos]
series: modelado-de-bases-de-datos
series_order: 1
---

Antes de comenzar, esta será una serie de post y no va orientado a una explicación superficial del performance detrás del modelado hasta la  normalización, iremos un poco más a profundidad, entendiéndolo desde la perspectiva de alguien que construye sistemas en base a la información que ellos manejan.

A su vez tendremos un  enfoque práctico el cual llevaremos usando como referencia el modelado de datos de este mismo blog personal.

Es necesario tener de ante mano alguna noción de bases de datos, cosas como por ejemplo que es un MER, un MR, una tabla, una foreign key…etc, sin embargo no esto no lo considero como un limitante, es una recomendación.

---

Todo se resume en una frase:

> “the real world consists of entities and relationships”—Peter Pin-Shan Chen.
> 

---

## Modelado:

Para un correcto modelado de bases de datos yo personalmente lo subdivido en tres fases generales. 

1. `MER`: modelo-entidad-relación.
2. `MR` : modelo-relacional.
3. `Normalización` :  proceso por el cuál se elimina la redundancia.

Ejecutar las fases en ese orden específico es lo más natural para los principiantes, aunque con el tiempo personalmente la normalización una vez entendida, la aplico a partir de la segunda fase y una pequeña parte de ella también en la primera debido a que la práctica me ha permitido percibir la falta de normalización en un modelo a primera vista.

> *Aunque hay tres fases, todas dependen netamente de una sola, y es el **análisis del caso de estudio,** de aquí se deriva todo, un modelo normalizado ciegamente no cumple su objetivo porque la normalización y el modelado no son reglas objetivas, dependen completamente de su contexto.*
> 

---
