---
title: "🛡️ Los datos de tu empresa en manos de un desarrollador"
summary: "Debes aprender a dividir responsabilidades..."
tags: ["Inteligencia de negocios"]
---

### Lo que todo empresario debe saber antes de firmar un contrato de desarrollo de software

---

## 🚪 Apertura: el emprendedor ya no tiene opción

> **"Hoy en día el emprendedor está obligado a entrar al mundo digital, por el bien de su productividad y de su privacidad."**

Digitalizarse dejó de ser una ventaja competitiva: es una condición para sobrevivir. Y el camino habitual es claro: **contratar a un desarrollador**, esa persona o equipo que se encarga de la migración digital del negocio.

Sin embargo, aquí aparece el punto ciego. El desconocimiento a la hora de trabajar con un desarrollador puede jugarle en contra a un empresario inexperto.

**¿Por qué?**

Porque no sabemos cómo están tratando lo más importante de un software en 2026: **LOS DATOS**.

Cada vez que un desarrollador toca tu sistema, está tocando:

- 📇 Los datos personales de **tus clientes** (nombres, cédulas, teléfonos, correos, historiales de compra)
- 🏢 La información sensible de **tu empresa** (finanzas, proveedores, estrategia, precios)

Ser conscientes del trato que se les da a esos datos no es paranoia: **es responsabilidad legal y comercial del empresario**. La ley colombiana considera a la empresa la *Responsable del Tratamiento*, incluso cuando el error lo comete un tercero contratado.

Con eso claro, desarrollemos el proceso en cinco frentes.

---

## 1. 📝 El contrato de confidencialidad: la primera línea de defensa

Antes de que el desarrollador vea una sola tabla de tu base de datos, debe existir un acuerdo firmado. En la práctica hablamos de dos figuras que se complementan:

**a) El Acuerdo de Confidencialidad (NDA)**
Obliga al desarrollador a no divulgar, copiar ni usar para fines propios la información a la que acceda. Debe definir:

- Qué se considera *información confidencial* (código, datos, procesos, credenciales)
- La duración de la obligación (idealmente, que sobreviva al fin del contrato: 2 a 5 años o indefinida para datos personales)
- Las consecuencias del incumplimiento (cláusula penal)

**b) El Contrato de Transmisión / Encargo del Tratamiento**
Este es el que casi nadie firma y el que la Ley 1581 de 2012 espera que exista. Cuando el desarrollador manipula datos personales por cuenta de tu empresa, se convierte en **Encargado del Tratamiento**, y tú sigues siendo el **Responsable**. Este contrato debe establecer:

- Las finalidades autorizadas del tratamiento (solo puede usar los datos para el desarrollo, nada más)
- Las medidas de seguridad exigidas
- La obligación de devolver o eliminar los datos al terminar el proyecto
- La prohibición de subcontratar o mover los datos sin autorización

> 💡 **Mensaje para la audiencia:** un desarrollador profesional no se ofende cuando le piden firmar un NDA. Al contrario: lo espera. Desconfía de quien se resiste.

---

## 2. 🚨 ¿Y si se filtran los datos? Plan de respuesta a incidentes

Supongamos lo peor: la base de datos de clientes terminó expuesta. **La empresa es la que responde ante la ley y ante los clientes**, no puede simplemente señalar al desarrollador. Estas son las medidas que debe ejecutar:

**Fase inmediata (primeras horas)**
1. **Contener la fuga:** revocar credenciales, cerrar el acceso comprometido, aislar el sistema afectado
2. **Documentar todo:** qué datos se expusieron, cuántos registros, desde cuándo, cómo ocurrió

**Fase de notificación (días siguientes)**
3. **Reportar a la Superintendencia de Industria y Comercio (SIC):** en Colombia, los incidentes de seguridad sobre datos personales deben informarse a la SIC a través del Registro Nacional de Bases de Datos (RNBD)
4. **Informar a los titulares afectados:** los clientes tienen derecho a saber que sus datos fueron comprometidos, qué información se expuso y qué medidas tomar (cambiar contraseñas, vigilar movimientos bancarios)

**Fase de recuperación**
5. **Auditoría técnica:** identificar la causa raíz y corregirla antes de restablecer el servicio
6. **Revisar responsabilidades contractuales:** aquí es donde el NDA y el contrato de encargo cobran valor — permiten repetir contra el desarrollador si el incidente fue por su negligencia
7. **Plan de comunicación:** una empresa que informa con transparencia sufre menos daño reputacional que una que oculta

> ⚠️ **Dato que duele:** ocultar una fuga puede salir más caro que la fuga misma. La SIC puede imponer sanciones significativas, y la pérdida de confianza de los clientes no tiene tarifa.

---

## 3. 🔐 Las obligaciones técnicas del desarrollador

El desarrollador no solo firma papeles: **se responsabiliza de aplicar las medidas técnicas pertinentes** para proteger los datos durante el desarrollo. Como empresario, estas son las prácticas que debes exigir (y sobre las que puedes preguntar sin ser técnico):

| Medida | ¿Qué significa en cristiano? |
|---|---|
| **Ofuscación / Enmascaramiento** | En los ambientes de prueba no se usan los datos reales de tus clientes, sino versiones alteradas o ficticias |
| **Anonimización / Seudonimización** | Se eliminan o reemplazan los identificadores (nombres, cédulas) cuando no son necesarios |
| **Cifrado** | Los datos viajan y se almacenan encriptados, tanto en tránsito como en reposo |
| **Control de accesos** | Cada persona del equipo accede solo a lo que necesita (principio de mínimo privilegio) |
| **Ambientes separados** | Desarrollo, pruebas y producción son entornos distintos; los datos reales solo viven en producción |
| **Gestión de credenciales** | Las contraseñas y llaves de acceso no van escritas en el código ni compartidas por WhatsApp |
| **Respaldos (backups)** | Copias de seguridad periódicas, cifradas y probadas |

> 💡 **Pregunta poderosa para hacerle a tu desarrollador:** *"¿Con qué datos vas a hacer las pruebas del sistema?"* Si la respuesta es "con la base de datos real de tus clientes", ahí tienes una bandera roja.

---

## 4. ⚖️ Habeas Data.
**¿Qué implica el Habeas Data en un desarrollo de software?**

El sistema que te construyan debe nacer respetando estos derechos. Eso se traduce en requisitos concretos:

1. **Autorización previa:** el software debe recolectar el consentimiento del titular antes de guardar sus datos (el famoso checkbox de política de datos no es decoración)
2. **Finalidad informada:** solo se pueden usar los datos para lo que el cliente autorizó
3. **Derechos del titular:** el sistema debe permitir consultar, corregir y eliminar los datos cuando el cliente lo pida
4. **Política de Tratamiento de Datos:** tu empresa debe tenerla publicada, y el software debe enlazarla
5. **Registro Nacional de Bases de Datos:** si tu empresa está obligada, sus bases de datos deben estar inscritas en el RNBD de la SIC

> 💡 **Concepto clave para la audiencia:** *Privacy by Design* — la privacidad no se le agrega al software al final como una capa de pintura; se diseña desde el primer día. Exígelo en el contrato.

---

## 5. 📜 Las licencias del software: ¿de quién es lo que pagaste?

El último frente, y uno de los más olvidados. Cuando pagas por un desarrollo, hay que dejar claro **qué estás comprando realmente**:

**a) Propiedad del código**
- ¿El código fuente **es tuyo** (cesión de derechos patrimoniales) o el desarrollador te da una **licencia de uso** y él conserva la propiedad?
- Si no se pacta nada por escrito, puedes llevarte sorpresas: quedar atado de por vida al mismo desarrollador para cualquier cambio
- **Recomendación:** pactar por escrito la cesión de derechos patrimoniales sobre el código desarrollado a la medida, y la entrega del código fuente y su documentación

**b) Licencias de terceros (open source)**
Casi ningún software se escribe desde cero: los desarrolladores usan librerías y componentes de código abierto. Cada uno viene con su licencia:

- **Licencias permisivas** (MIT, Apache 2.0): permiten uso comercial con pocas condiciones ✅
- **Licencias copyleft** (GPL): pueden obligarte a liberar tu propio código si distribuyes el software ⚠️
- **Componentes sin licencia clara o piratas:** riesgo legal directo para tu empresa ❌

**c) Licencias de infraestructura y servicios**
Bases de datos, servicios en la nube, APIs de terceros: ¿quién paga esas licencias, a nombre de quién quedan las cuentas y qué pasa si el desarrollador se va?

> ⚠️ **Bandera roja clásica:** las cuentas de la nube, el dominio y las credenciales quedan a nombre personal del desarrollador. El día que la relación termina mal, tu negocio queda secuestrado. **Todo debe quedar a nombre de la empresa.**

---

## 🎯 Cierre: el checklist del empresario digital

Para aterrizar la charla, este es el resumen que tu audiencia debería llevarse en el bolsillo:

- [ ] Firmé un **NDA** y un **contrato de encargo del tratamiento** con mi desarrollador
- [ ] Tengo un **plan de respuesta** si se filtran datos (contener → documentar → notificar a la SIC → informar a clientes)
- [ ] Exigí **medidas técnicas**: datos de prueba ofuscados, cifrado, control de accesos
- [ ] Mi software respeta el **Habeas Data**: autorización, finalidad, derechos del titular
- [ ] El contrato define **de quién es el código** y todas las cuentas están **a nombre de mi empresa**

> **Frase de cierre sugerida:**
> *"Contratar un desarrollador sin hablar de datos es como entregarle las llaves del negocio sin preguntar su nombre. La transformación digital no es solo tecnología: es confianza con reglas claras."*

---

*Material de apoyo — Charla sobre tratamiento de datos entre contratante y contratista en proyectos de desarrollo de software. Marco normativo de referencia: Constitución Política de Colombia (art. 15), Ley 1266 de 2008 y Ley 1581 de 2012. Este material es informativo y no constituye asesoría legal.*
