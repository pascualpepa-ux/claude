# Restaurantes con muchas reseñas en Google y poca respuesta del propietario: ciudades turísticas de España (sin Madrid, Barcelona ni Valencia)

> **Método y limitación principal (comprobado el 2026-11-03, hacia las 17:40–18:00 UTC):**
> - **Google Maps (Playwright en modo headless, hl=es):** bloqueado. Todas las peticiones a `google.com/maps` y `google.es/maps` acabaron en la página `google.com/sorry` ("Nuestros sistemas han detectado tráfico inusual…", HTTP 429). Probé con dos IP de salida distintas y ambas estaban bloqueadas. WebFetch sobre una URL de Google Maps solo devolvió el texto "Google Maps".
> - **Otras fuentes:** TripAdvisor (.es, tanto con Playwright como con WebFetch) devolvió 403, Yelp 403 y Restaurant Guru 503 con captcha.
> - **Consecuencia:** **no pude comprobar si hay "Respuesta del propietario" en ningún candidato.** Todos los datos de no respuesta de abajo están marcados como **NO VERIFICADOS**. No me invento ningún recuento de respuestas.
> - **Lo que sí funcionó:** Wanderlog (wanderlog.com/place/details/…), que replica la nota y el número de reseñas de Google y de TripAdvisor, junto con dirección, web y teléfono. Lo extraje con Playwright el 2026-11-03. Wanderlog **no** muestra las respuestas del propietario. También usé fragmentos de buscadores y de agregadores (PosDo, Gastroranking), que son fuentes de menor confianza.
> - **Nota para quien redacte el informe:** la lista de candidatos está completa en cuanto a volumen de reseñas y canales de contacto, pero el criterio que define a un buen prospecto (no responde) está sin comprobar. Antes de cualquier contacto hay que revisarlo a mano en un navegador normal: ordenar por "Más recientes" y contar las respuestas del propietario en las 10 últimas reseñas.

## Candidatos: nombre, ciudad, nota, número de reseñas y evidencia de no respuesta

### Takeaway
Encontré 8 fichas de restaurante de mucho volumen (entre unas 2.500 y 15.000 reseñas en Google) en Sevilla, Málaga, Granada, Palma y San Sebastián. Son bares de tapas históricos o muy turísticos, con un perfil que suele asociarse a pocas respuestas. En ninguno pude verificar la tasa de respuesta del propietario porque Google bloqueó el acceso automatizado. Los mejores prospectos *a priori* son Bar Bosch (Palma), Bar Néstor (San Sebastián), Bodega Santa Cruz "Las Columnas" (Sevilla), El Rinconcillo (Sevilla) y Antigua Casa de Guardia (Málaga).

### Cited Findings
**Sevilla**
- **Bodega Santa Cruz "Las Columnas"**, C. Rodrigo Caro 1 / Barrio Santa Cruz. Nota de Google 4,4, con **15.023** reseñas según el bloque de Google en PosDo. En el mismo PosDo hay un texto de descripción que dice 4.757 reseñas, una cifra que se contradice dentro de la propia página. — [PosDo](https://pos.do/de/seville/restaurant/bodega-santa-cruz-las-columnas). Es un bar de pie, siempre lleno ("comer tapas allí se convierte en un deporte de contacto", según Lonely Planet, citado en el resumen de búsqueda). — [Frommer's](https://www.frommers.com/destinations/seville/restaurants/bodega-santa-cruz). Respuesta del propietario: **NO VERIFICADA**. En PosDo la única web enlazada es Instagram, lo que apunta a poca presencia digital gestionada (inferencia).
- **El Rinconcillo** (bar en funcionamiento desde 1670), C. Gerona 40. Nota de Google 4,3, con unas **13.750** reseñas — [PosDo](https://pos.do/en/sevilla/restaurant/el-rinconcillo) (agregador, confianza media). Web propia: elrinconcillo.es — [elrinconcillo.es](https://www.elrinconcillo.es/en/home). Respuesta del propietario: **NO VERIFICADA**.

**Málaga**
- **Antigua Casa de Guardia** (taberna de vinos fundada en 1840), Alameda Principal 18. Google: **4,6 con 11.166 reseñas**. TripAdvisor: 927 reseñas. Web: antiguacasadeguardia.com. Teléfono: +34 952 21 46 80 — [Wanderlog](https://wanderlog.com/place/details/420111), extraído el 2026-11-03. Gastroranking suma 10.914 opiniones entre 3 webs — [Gastroranking](https://gastroranking.es/r/taberna-antigua-casa-de-guardia_43799/). Respuesta del propietario: **NO VERIFICADA**.

**Granada**
- **Bar Los Diamantes, Plaza Nueva 13.** Google: **4,3 con 14.033 reseñas**. TripAdvisor: 5.620. — [Wanderlog](https://wanderlog.com/place/details/1232046)
- **Los Diamantes, C. Navas 28.** Google: **4,5 con 5.486 reseñas** — [Wanderlog](https://wanderlog.com/place/details/409709)
- **Los Diamantes, sucursal Bib Rambla.** Unas 2.715 opiniones en Google según Gastroranking — [Gastroranking](https://gastroranking.es/r/los-diamantes-bib-rambla_252267/)
- **Los Diamantes II, Plaza de los Campos 1.** TripAdvisor: 787. Teléfono: +34 619 78 78 28. Página de contacto: barlosdiamantes.com/contact.php — [Wanderlog](https://wanderlog.com/place/details/1465678)
- **Señal en contra de Los Diamantes:** el enlace web de las fichas de Google lleva parámetros UTM `utm_source=google_my_business&utm_medium=ficha_gmb&utm_campaign=plaza_nueva/navas` — [Wanderlog](https://wanderlog.com/place/details/1232046). Esto indica que alguien (posiblemente una agencia) gestiona activamente el Perfil de Empresa de Google. Puede que ya respondan, o que tengan un proveedor. Respuesta del propietario: **NO VERIFICADA**.

**Palma de Mallorca**
- **Bar Bosch**, Pl. del Rei Joan Carles I 6 (abierto desde 1936). Google: **3,9 con 4.984 reseñas**. TripAdvisor: 959. Web: barbosch.com. Teléfono: +34 971 71 22 28 — [Wanderlog](https://wanderlog.com/place/details/499172). Las reseñas son dispares, con quejas de servicio lento o antipático y precios altos — [Wanderlog](https://wanderlog.com/place/details/499172); [Majorca Daily Bulletin](https://amp.majorcadailybulletin.com/food-and-drink/food-and-drink/2025/01/06/130203/the-bar-review-bar-bosch-palma.html). Respuesta del propietario: **NO VERIFICADA**.

**San Sebastián**
- **Bar Néstor**, Arrandegi Kalea 11, Parte Vieja. Google: **4,5 con 2.502 reseñas**. TripAdvisor: 2.233. Distribución de las de Google: 1.955 de 5★, 248 de 4★, 98 de 3★ y 44 de 2★. Web: solo Instagram (instagram.com/barnestor1980). Teléfono: +34 943 42 48 73 — [Wanderlog](https://wanderlog.com/place/details/384993), extraído el 2026-11-03. Las reseñas destacadas que muestra Wanderlog están en inglés, lo que apunta a una clientela internacional muy alta — [Wanderlog](https://wanderlog.com/place/details/384993). Respuesta del propietario: **NO VERIFICADA**.

**Alicante**
- **Cervecería Sento**, una cadena local que ya tiene 6 locales — [AlicantePlaza](https://alicanteplaza.es/alicanteplaza/cerveceria-sento-sigue-creciendo-y-abre-su-sexto-local-a-espaldas-de-el-corte-ingles). Las fichas individuales parecen modestas: la sucursal Barrio tiene 4,3 con 517 reseñas según TripAligner — [TripAligner](https://tripaligner.com/countries/spain-39/destinations/alacant-alicante-4342/places/cerveceria-sento-barrio-7998291), y la de Albufera 383 opiniones según Gastroranking — [Gastroranking](https://gastroranking.es/r/cerveceria-sento-albufera-2_233295/). Número de reseñas en Google y respuestas del propietario: **NO VERIFICADOS**.

### Inferences
- Los bares de tapas tradicionales y de pie (Las Columnas, El Rinconcillo, Casa de Guardia, Bar Néstor) que cuentan con Instagram o una web sencilla como único canal digital son, a priori, los perfiles que menos responden a las reseñas en Google. Esto es una hipótesis y no está comprobado.
- Bar Bosch es el prospecto más claro sobre el papel: casi 5.000 reseñas, nota baja de 3,9, reseñas negativas sobre servicio y precio, y una plaza muy turística en Palma. Si de verdad no responde, el caso de negocio ("las reseñas negativas sin respuesta en varios idiomas te cuestan clientes") es el más sólido.
- Es probable que Los Diamantes (Granada) gestione activamente su Perfil de Empresa de Google por los UTM, así que puede ser un prospecto peor, o uno para un argumento de "cambia de proveedor". Revisarlo primero.

### Gaps
- **Recuento de respuestas del propietario en las 10 últimas reseñas:** sin dato para TODOS los candidatos. Google Maps, TripAdvisor, Yelp y Restaurant Guru bloquearon el acceso automatizado desde este entorno el 2026-11-03.
- **Porcentaje de reseñas en idiomas extranjeros:** no se pudo medir. Solo hay indicios en las reseñas destacadas de Wanderlog (Bar Néstor, Bar Bosch, en inglés).
- **Faltan candidatos de Marbella, Torremolinos y Alicante** con más de 500 reseñas verificadas. No llegué a investigarlos por el límite de llamadas a herramientas.
- Las cifras de PosDo para Sevilla se contradicen (15.023 frente a 4.757 en la misma página) y deben comprobarse en Google.
- La lista tiene 8 fichas (contando Los Diamantes como varias), no las 8–15 **verificadas** del objetivo.

## Web y canal de contacto público del negocio

### Takeaway
Los datos de contacto de abajo proceden de los campos web y teléfono de las fichas de Google replicados en Wanderlog, o de las webs oficiales. No encontré ningún email genérico del negocio. Varios locales solo publican teléfono y web o Instagram.

### Cited Findings
- **Antigua Casa de Guardia (Málaga):** web antiguacasadeguardia.com, teléfono +34 952 21 46 80 — [Wanderlog](https://wanderlog.com/place/details/420111)
- **Bar Bosch (Palma):** web barbosch.com, teléfono +34 971 71 22 28 — [Wanderlog](https://wanderlog.com/place/details/499172)
- **Bar Néstor (San Sebastián):** instagram.com/barnestor1980, teléfono +34 943 42 48 73 — [Wanderlog](https://wanderlog.com/place/details/384993)
- **El Rinconcillo (Sevilla):** web elrinconcillo.es (con sistema de reservas), teléfono +34 954 223 183 — [elrinconcillo.es](https://www.elrinconcillo.es/en/home), confirmado en resultados de búsqueda
- **Los Diamantes (Granada):** webs losdiamantes.es y barlosdiamantes.com/contact.php (formulario de contacto), teléfono +34 619 78 78 28 (sucursal II) — [Wanderlog](https://wanderlog.com/place/details/1465678)
- **Bodega Santa Cruz "Las Columnas" (Sevilla):** solo enlace a Instagram — [PosDo](https://pos.do/de/seville/restaurant/bodega-santa-cruz-las-columnas)

### Inferences
- El canal más fiable para todos es el teléfono. Para Las Columnas y Néstor, además, Instagram (MD del negocio).

### Gaps
- No se ha confirmado ningún email genérico del negocio. No revisé las páginas de contacto de barbosch.com, antiguacasadeguardia.com ni elrinconcillo.es.

## Extra: local único o grupo, y reseñas negativas sin responder

### Takeaway
La mayoría son locales únicos. Los Diamantes (Granada, al menos 4 locales) y Cervecería Sento (Alicante, 6 locales) son grupos, lo que los hace atractivos para una venta con varias ubicaciones. No pude verificar reseñas negativas sin responder.

### Cited Findings
- Los Diamantes tiene varias fichas (Plaza Nueva, Navas, Bib Rambla, Los Diamantes II), con unas 13.000 reseñas en total en Google según los resúmenes de búsqueda — [Gastroranking](https://gastroranking.es/r/los-diamantes_23930/); [Wanderlog](https://wanderlog.com/place/details/1232046)
- Cervecería Sento abrió su sexto local — [AlicantePlaza](https://alicanteplaza.es/alicanteplaza/cerveceria-sento-sigue-creciendo-y-abre-su-sexto-local-a-espaldas-de-el-corte-ingles)
- Bar Bosch: 3,9★ y reseñas dispares, con quejas de servicio y precio — [Wanderlog](https://wanderlog.com/place/details/499172)

### Inferences
- Bar Bosch es el más propenso a acumular reseñas negativas sin responder, pero no está verificado.

### Gaps
- Estado de las respuestas a las reseñas negativas: no verificado para todos los candidatos.
