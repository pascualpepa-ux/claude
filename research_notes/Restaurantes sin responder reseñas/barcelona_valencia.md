# Restaurantes con muchas reseñas de Google y poca/ninguna respuesta del propietario — Barcelona y Valencia (prospectos Reseki)

Research date: 2026-11-03. Researcher: subagent. All figures below come from secondary sources and are labelled as such.

## 1. Candidates, Google review volume and EVIDENCE of non-response

### Takeaway
I built a shortlist of 12 high-volume restaurants (6 Barcelona, 6 Valencia), each with roughly 2,300 to 25,000 Google reviews according to the Gastroranking aggregator. **I could not verify owner-reply behaviour (non-response) for any of them.** Google Maps and Google Search both returned a CAPTCHA "tráfico inusual" block from this environment. TripAdvisor and TheFork returned HTTP 403. Every candidate is therefore **"response status: UNVERIFIED"**. Treat this as a volume-qualified shortlist that needs a manual 2-minute check before outreach. The check protocol is in the Inferences below.

### How and when I checked (method log, 2026-11-03 ~17:42–18:10 UTC)
- Playwright/Chromium (headless, locale es-ES) on `google.com/maps/search/...?hl=es` and `google.es/maps?q=...` redirected to `google.com/sorry/index`. That page said "Nuestros sistemas han detectado tráfico inusual procedente de tu red de ordenadores" before any consent wall appeared. A plain curl to `google.es/search` returned 200, but the Playwright attempt on the same URL was also redirected to `/sorry`. WebFetch of a Google Maps URL returned only the title "Google Maps".
- TripAdvisor (curl, WebFetch and Playwright): HTTP 403. TheFork: 403. Restaurant Guru: 503.
- **Fallback used:** Gastroranking.es restaurant pages (fetched via curl and WebFetch). They list per-platform review counts and scores (Google, TripAdvisor) on a 10-point scale. Google 9.2/10 ≈ 4.6/5. Gastroranking's update date for these counts is not stated, so the counts may lag live Google. For example, one guide cited 7,177 Google reviews for Bar Cañete, while Gastroranking shows 8,470.
- Gastroranking shows review snippets **without** owner responses. That absence is NOT evidence of non-response, because the site does not appear to mirror responses at all.
- Foreign-language share of reviews: not observable with the sources available → unverified.

### Cited Findings — Barcelona (6)
| # | Restaurant | Neighbourhood | Google score / count (Gastroranking) | TripAdvisor score / count | Single vs group | Owner-reply status |
|---|---|---|---|---|---|---|
| B1 | Bar Cañete, C/ de la Unió 17 | El Raval (Ciutat Vella) | 9.2/10 (≈4.6★) / 8,470 | 9.0 / 3,356 | Single venue (as far as seen) | UNVERIFIED |
| B2 | Can Paixano (La Xampanyeria), C/ Reina Cristina 7 | Barceloneta / Gòtic edge (Gastroranking files it under El Barri Gòtic) | 9.2 / 10,107 | 9.0 / 2,837 | Single venue | UNVERIFIED |
| B3 | Bar Tomás de Sarrià | Sarrià | 8.6 (≈4.3★) / 7,397 | 7.4 / 868 | Single venue | UNVERIFIED (mixed recent reviews, e.g. an Apr-2026 complaint that it "lives off its reputation") |
| B4 | Quimet & Quimet, C/ Poeta Cabanyes 25 | El Poble-sec | 9.2 / 5,640 | 9.0 / 2,154 | Single venue | UNVERIFIED |
| B5 | Cervecería Catalana, C/ Mallorca 236 | Eixample | 9.0 (≈4.5★) / 25,195 | 8.8 / 13,382 | **Group**: Gastroranking links its website to laflautagroup.com | UNVERIFIED (a group is more likely to have staff who already reply) |
| B6 | Ciudad Condal, Rambla de Catalunya 18 | Dreta de l'Eixample | 8.8 (≈4.4★) / 23,735 | 8.8 / 10,551 | **Group**: website listed as laflautagroup.com | UNVERIFIED |

Sources: [Bar Cañete – Gastroranking](https://gastroranking.es/r/bar-canete_51367/); [Can Paixano – Gastroranking](https://gastroranking.es/r/can-paixano-la-xampanyeria_51425/); [Bar Tomás – Gastroranking](https://gastroranking.es/r/bar-tomas_50490/); [Quimet & Quimet – Gastroranking](https://gastroranking.es/r/quimet-quimet_51488/); [Cervecería Catalana – Gastroranking](https://gastroranking.es/r/cerveceria-catalana_51439/); [Ciudad Condal – Gastroranking](https://gastroranking.es/r/ciudad-condal_171831/)

- Reserve candidate: El Xampanyet (El Born), with TripAdvisor 9.0 / 2,881. Gastroranking's Google count shows "3", an evident data error, so its Google count is unverified. Its website elxampanyet.com reset the connection. — [Gastroranking](https://gastroranking.es/r/el-xampanyet_51465/)

### Cited Findings — Valencia (6)
| # | Restaurant | Neighbourhood | Google score / count (Gastroranking) | TripAdvisor score / count | Single vs group | Owner-reply status |
|---|---|---|---|---|---|---|
| V1 | Casa Montaña (Bodega), C/ José Benlliure 69 | El Cabanyal / Canyamelar (Poblats Marítims) | 9.2 / 6,236 | 9.0 / 2,621 | Single venue. Official site is emilianobodega.com, titled "Casa Montaña" | UNVERIFIED |
| V2 | La Pepica, Passeig de Neptú 6 | Malvarrosa / Platja de les Arenes | 7.8 (≈3.9★) / 14,969 | 7.4 (TA count on this listing: 23; another Gastroranking TA-only listing shows ~6,100) | Single venue | UNVERIFIED. Lower score means a larger pool of negative reviews, a strong pitch angle if they are unanswered |
| V3 | Horchatería Santa Catalina, Pl. Santa Catalina 6 | Ciutat Vella (La Seu/El Mercat) | 8.4 (≈4.2★) / 12,582 | 8.2 / 4,559 | Single venue | UNVERIFIED. Reviews mention queues, rushed service and a "touristy" feel |
| V4 | La Riuà, C/ del Mar 27 | Ciutat Vella (La Seu) | 8.4 / 3,463 | 7.8 / 1,961 | Single venue | UNVERIFIED |
| V5 | Central Bar, Mercat Central | Ciutat Vella (El Mercat) | 9.0 / 2,341 | 9.0 / 1,136 | **Group**: centralbar.es lists emails at camarenagastronomia.com and ricardcamarena.com (Ricard Camarena group) | UNVERIFIED (group, so lower priority) |
| V6 | La Pilareta / Bar Pilar, C/ Moro Zeit 13 | Ciutat Vella (El Carme) | Google count not parsed from Gastroranking (page layout differs) | — | Single venue | UNVERIFIED (volume unverified too) |

Sources: [Casa Montaña – Gastroranking](https://gastroranking.es/r/casa-montana_154/); [La Pepica – Gastroranking](https://gastroranking.es/r/la-pepica_167991/); [La Pepica (alt listing) – Gastroranking](https://gastroranking.es/r/restaurante-la-pepica_203252/); [Horchatería Santa Catalina – Gastroranking](https://gastroranking.es/r/horchateria-santa-catalina_46972/); [La Riuà – Gastroranking](https://gastroranking.es/r/la-riua_309/); [Central Bar – Gastroranking](https://gastroranking.es/r/central-bar_24/); [La Pilareta – Gastroranking](https://gastroranking.es/r/la-pilareta-bar-pilar_46984/)

- Conflict: a search-engine summary claimed Central Bar had no link to Ricard Camarena. However, the bar's own site (m.centralbar.es, fetched 2026-11-03) publishes contact addresses on camarenagastronomia.com and ricardcamarena.com, which points to group ownership. — [centralbar.es](http://www.centralbar.es/)

### Inferences
- These venues are all landmark, tourist-heavy places, so a high share of non-Spanish reviews is likely. That fits Reseki's multilingual value proposition, but it is an inference and the language share was not measured.
- Priority order for manual verification: single, family-run, high-volume venues first (Bar Cañete, Can Paixano, Quimet & Quimet, Bar Tomás, Casa Montaña, La Pepica, Horchatería Santa Catalina, La Riuà). Group venues come last (Cervecería Catalana and Ciudad Condal under La Flauta; Central Bar under Camarena), because groups more often have staff or tools that already reply.
- **Manual check protocol (2 min per venue):** open the Google Maps place page in a normal browser with hl=es, go to Reseñas, sort by "Más recientes", count "Respuesta del propietario" among the 10 most recent reviews, count how many of those 10 are not in Spanish, and note how many 1–2★ reviews in the last ~30 are unanswered. Record the date. Only list a venue as a prospect if 0–2 of the 10 have replies.

### Gaps
- Owner-reply rate on Google: unverified for all 12, because Google returned a CAPTCHA/IP block. TripAdvisor management responses (proxy) were also unavailable (403).
- Live Google review counts: only the aggregator's possibly stale figures are available. Live Google ratings in ★ were not observed.
- Share of foreign-language reviews: not measured.
- Unanswered negative reviews: not measurable without Google access.

## 2. Website and public business contact channels

### Takeaway
Most candidates publish a phone number and a contact or booking page on their own website. Only a few publish a generic business email. All channels below were taken from the restaurant's own site (fetched 2026-11-03) unless noted. No personal data was collected.

### Cited Findings
- Bar Cañete: [barcanete.com](https://barcanete.com/). Contact page [barcanete.com/contacto/](https://barcanete.com/contacto/) lists reservas@barcanete.com and +34 932 70 34 58. Bookings at barcanete.com/reservas.
- Can Paixano: [canpaixano.com](https://www.canpaixano.com/). No email or phone found in the homepage HTML. Gastroranking also lists no phone. → contact channel unverified.
- Bar Tomás: [eltomasdesarria.com](https://www.eltomasdesarria.com/). Contact page [/contacto/](https://www.eltomasdesarria.com/contacto/) shows +34 932 03 10 77. No email found.
- Quimet & Quimet: [quimetiquimet.com](https://quimetiquimet.com/). Contact page [/contacto/](https://quimetiquimet.com/contacto/) shows +34 934 42 31 42. The only email-like string, "micorreo@gmail.com", appears to be a form placeholder, so it is not a real channel.
- Cervecería Catalana and Ciudad Condal: group site [laflautagroup.com](https://www.laflautagroup.com/), a Wix site with no email in the HTML. Phones from Gastroranking: Cervecería Catalana 932 16 03 68, Ciudad Condal 933 18 19 97. — [Gastroranking](https://gastroranking.es/r/cerveceria-catalana_51439/), [Gastroranking](https://gastroranking.es/r/ciudad-condal_171831/)
- Casa Montaña: [emilianobodega.com](https://www.emilianobodega.com/) lists info@emilianobodega.com and +34 963 67 23 14, with a contact page at /contacto/ and bookings at /reservar. A separate domain, casamontana.es, serves an unrelated theme template, so ignore it.
- La Pepica: [lapepica.com](https://lapepica.com/) lists +34 963 71 03 66, a contact page at [/contacto/](https://lapepica.com/contacto/) and bookings at /reserva/. The only email in the HTML is the template placeholder "info@website.com", so no real email was found.
- Horchatería Santa Catalina: [horchateriasantacatalina.com](https://www.horchateriasantacatalina.com/). Contact page [/contacto/](https://www.horchateriasantacatalina.com/contacto/) lists info@horchateriasantacatalina.com. Phone from Gastroranking: 963 91 23 79.
- La Riuà: [lariua.com](https://www.lariua.com/) has a contact page at /contacto and CoverManager booking. Phone from Gastroranking: 963 91 45 71. No email found.
- Central Bar: [centralbar.es](http://www.centralbar.es/). Phone from Gastroranking: +34 963 82 92 23. The site's addresses are departmental group addresses (accounting and social media), so they are not ideal sales channels. A better route is the group-level contact.
- La Pilareta: phone 963 91 04 97 (from Gastroranking). No website found.

### Inferences
- The best email-reachable single-venue prospects are Bar Cañete (reservas@), Casa Montaña (info@) and Horchatería Santa Catalina (info@). The others are reachable only by contact form or phone.

### Gaps
- Contact forms were identified by URL only. Whether each form is functional was not tested, since no contact was to be made.
- Can Paixano and La Pilareta have no verified channel on their own website.

## 3. Bonus: single vs group; unanswered negative reviews

### Takeaway
Three candidates belong to groups: Cervecería Catalana and Ciudad Condal (La Flauta group) and Central Bar (Ricard Camarena group). The rest appear to be single venues. Negative-review volume can only be approximated from scores: La Pepica (7.8/10 Google) and Bar Tomás (8.6) have the lowest Google scores. Whether their negative reviews are answered is unverified.

### Cited Findings
- Cervecería Catalana and Ciudad Condal both list laflautagroup.com as their website. — [Gastroranking](https://gastroranking.es/r/cerveceria-catalana_51439/), [Gastroranking](https://gastroranking.es/r/ciudad-condal_171831/)
- Central Bar's site publishes @camarenagastronomia.com and @ricardcamarena.com addresses. — [centralbar.es](http://www.centralbar.es/)
- La Pepica: Google 7.8/10 on ~15k reviews. Reviews cite small portions and a draught from the terrace door (Jan 2026). — [Gastroranking](https://gastroranking.es/r/la-pepica_167991/)
- Horchatería Santa Catalina: reviewers report queues, rushed or impersonal service and a tourist orientation. — [Gastroranking](https://gastroranking.es/r/horchateria-santa-catalina_46972/)

### Inferences
- A group (La Flauta or Camarena) would be a larger multi-location deal if they turn out not to reply, but groups are less likely to be non-responders.

### Gaps
- Number of unanswered 1–2★ reviews per venue: not measurable without Google Maps access.
