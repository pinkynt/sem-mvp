**DIAGNÓSTICO DE SEM**

_Desafío Hackathon - PunaTech 2026_

# 1\. Contexto general

## Resumen de contexto

"Hoy el SEM funciona con talonarios manuales, no existe trazabilidad digital, los cobros son solo en efectivo, puede haber cobros indebidos, no se declara el 100 % de todos los cobros y la Municipalidad no posee datos en tiempos real."_

## Descripción

La Municipalidad de Salta gestiona el estacionamiento vehicular en el microcentro de la ciudad a través del Sistema de Estacionamiento Medido (SEM), un esquema regulado por la Ordenanza N.º 12.170 que establece zonas habilitadas, franjas horarias y tarifas para el estacionamiento en la vía pública. El sistema contempla dos turnos: diurno (lunes a viernes de 07:00 a 21:00 h, sábados de 07:00 a 14:00 h) y nocturno (22:00 a 05:00 h de lunes a domingo, en cuadras expresamente habilitadas). Los días feriados y no laborables, el cobro diurno no está permitido, aunque el turno nocturno sí puede aplicarse. Son pocos los vecinos que conocen estas restricciones, lo que genera cobros indebidos que hoy el sistema no puede prevenir.

# 2\. Funcionamiento actual

El SEM se apoya en aproximadamente 900 permisionarios, personas jubiladas o con alguna discapacidad que la Municipalidad ha autorizado para gestionar el cobro del estacionamiento en una cuadra del área habilitada (hasta 100 metros lineales por permisionarios). No se encuentran en relación de dependencia con el Municipio: son trabajadores independientes cuya actividad está regulada y concesionada.

El operativo se sostiene sobre talonarios físicos impresos que los permisionarios adquieren en la Municipalidad a un costo equivalente al 20 % de la recaudación total (su "cuota" al Municipio). Cada ticket contiene:

- Hora de inicio del estacionamiento.
- Hora de finalización del estacionamiento.
- Importe cobrado (calculado manualmente por el permisionario).
- Dominio (para identificar la patente del vehículo)
- Legajo (para identificar al permisionario)

El cobro puede ser prepago (al estacionar) o pospago (al retirar el vehículo). La tarifa vigente es de \$700 por hora, única y uniforme para todos los vehículos y zonas. Se contempla una tolerancia de 5 minutos. Para motocicletas son \$ 300 por hora. Las tarifas son actualizables periódicamente.

Si el conductor abona una fracción horaria completa pero se retira antes de que se cumpla el tiempo total adquirido, puede estacionarse en cualquier otra cuadra habilitada del microcentro, sin abonar nada adicional, hasta que se cumpla la hora completa.

La propia ordenanza habilita expresamente el pago mediante aplicaciones móviles autorizadas por el Ejecutivo Municipal y cualquier otro medio de pago electrónico que se habilite en el futuro. Además, establece dos disposiciones operativas clave que cualquier solución digital debe implementar automáticamente:

- **Incentivo al pago digital:** Descuento del 20 % para pagos digitales: la diferencia es absorbida por la Municipalidad desde su porción del 20 %, sin afectar el ingreso del permisionario.
- **Fraccionamiento tarifario:** Fraccionamiento cada 15 minutos a partir de la segunda hora de estadía, aplicable a todos los tipos de vehículos alcanzados por tarifa y en ambos turnos (diurno y nocturno).
- **Zonificación nocturna:** El turno nocturno rige en zonas específicas: inmediaciones de locales de diversión, Paseo Balcarce, Paseo Güemes, Plaza Alvarado y las que en el futuro determine el Ejecutivo Municipal.

# 3\. Problema central

El sistema de talonarios manuales, aunque sencillo de operar, presenta una serie de limitaciones estructurales que afectan tanto a la recaudación municipal como al control del servicio:

- **Ausencia total de trazabilidad.**

Ningún pago queda registrado electrónicamente. La Municipalidad no cuenta con datos en tiempo real sobre recaudación, ocupación de espacios ni comportamiento de la demanda.

- **Control prácticamente nulo.**

La normativa prevé mecanismos de control, pero en la práctica no existen inspectores que los apliquen. En algunos casos los permisionarios no entregan el ticket al conductor; en otros, el monto cobrado no coincide con el registrado. El conductor que no desea pagar tampoco enfrenta consecuencias prácticas inmediatas.

- **Infracción frecuente y silenciosa.**

La ordenanza establece claramente los horarios en que el cobro está permitido, pero su desconocimiento generalizado -tanto entre vecinos como entre algunos permisionarios- permite que cobros indebidos ocurran con frecuencia, sin que el sistema pueda prevenirlos ni detectarlos.

- **Costos operativos y fricción innecesaria.**

Los permisionarios deben trasladarse físicamente a la Municipalidad para comprar los talonarios, generando desplazamientos, tiempos muertos y costos logísticos para ambas partes.

- **Exclusión de medios modernos.**

El sistema actual no admite ningún medio de pago digital. Esto limita la experiencia del conductor y reduce las posibilidades de auditoría y transparencia.

# 4\. Antecedente: intento de modernización (2024-2025)

La Municipalidad analizó durante 2025 una propuesta de SEM sin embargo el proyecto fue suspendido. La causa principal fue el tiempo de procesamiento de la plataforma de pago (con demoras de hasta 1 minuto en dicho proceso) y una demora total que alcanzaba los 2 minutos por transacción, tornando inviable la operativa en la vía pública.

# 5\. Desafío para el hackathon

La Municipalidad de Salta, en el marco del PunaTech 2026, propone a los equipos participantes diseñar una solución tecnológica que modernice integralmente la gestión del SEM, partiendo de los siguientes requisitos mínimos:

## Requisitos obligatorios

- **Inclusión social:** Mantener a los permisionarios como agentes activos del sistema.
- **Plataforma de pago:** Integrar Mercado Pago como plataforma de pago digital.
- **Medios de pago:** Admitir pago con transferencia, tarjeta de débito y tarjeta de crédito a través de Mercado Pago, y también en efectivo.
- **Registro 100 % digital:** Todo pago -sea en efectivo o digital- debe quedar registrado electrónicamente. Esto implicaría la eliminación de los talonarios físicos.
- **Cumplimiento normativo automático:** La solución debe respetar la Ordenanza N.º 12.170.
- **Éxito en velocidad:** La plataforma de pago elegida debe permitir transacciones en pocos segundos.

## Consideraciones adicionales para el diseño

- Rol del permisionario: los equipos pueden definir libremente qué acciones realiza el permisionario en el nuevo flujo, siempre que su participación y sus ingresos queden garantizados.
- Flujo del dinero: el pago puede ir directamente al permisionario (descontando la cuota municipal) o pasar primero por la Municipalidad y luego liquidarse al permisionario. Ambos esquemas son válidos.
- Efectivo: dado que el efectivo debe generar un registro digital, los equipos deben proponer un mecanismo que garantice esa trazabilidad.
- Conectividad: se puede asumir conectividad de datos móviles razonable en todas las cuadras del área de cobertura del SEM.
- Accesibilidad tecnológica: el sistema debe ser usable por conductores con distintos niveles de manejo del smartphone, y no debe asumir que el permisionario dispone obligatoriamente de un dispositivo móvil propio.

# 6\. Entregable esperado

Los equipos deberán presentar una propuesta que incluya obligatoriamente:

- Descripción del flujo completo de pago para el conductor. Los equipos pueden replantear completamente el flujo, si proponen una solución mejor, bienvenido.
- Descripción del rol del permisionario en el nuevo sistema y como se garantiza su continuidad.
- Mecanismo propuesto para el registro digital del pago en efectivo.
- Stack tecnológico o plataformas sugeridas con una breve justificación de cada elección.
- Demo funcional o prototipo navegable del sistema propuesto
- La demo deberá estar materializada mediante un video con cámara prendida, de alguno (o todos) los integrantes del equipo, de hasta 5 minutos de duración.

# 7\. Jurado y criterios de evaluación

Estará integrado por los siguientes integrantes de la Municipalidad:

- Ing Juan Sebastian Ibañez - Coordinador General de Modernización.
- Ing Alberto Dousdebes - Subsecretario de Nuevos Proyectos - Modernización.
- CPN Einer Batista - Project Manager Proyecto SEM - Modernización.

Los criterios de evaluación se basarán en:

- Factibilidad técnica.
- Innovación.
- Experiencia de usuario.

Los tres criterios ponderarán en partes iguales.