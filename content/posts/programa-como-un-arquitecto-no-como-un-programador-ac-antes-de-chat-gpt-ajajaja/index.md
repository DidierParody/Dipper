---
title: "Programa como un arquitecto, no como un programador A.C (Antes de Chat gpt ajajaja)."
summary: "Programar y programar bien son dos cosas diferentes...Domina los fundamentos de la programación con una guía práctica en Java diseñada para aprender de verdad. Explora cada concepto desde su lógica hasta su implementación con ejemplos paso a paso, ejercicios progresivos, retos y parciales acumulativos. Un recurso ideal para construir una base sólida antes de adentrarte en estructuras de datos, algoritmos, desarrollo de software y áreas profesionales de la ingeniería."
tags: ["fundamental concepts"]
---

Hola de nuevo, hoy haciendo un poco de scroll en las redes vi ese comentario *A.C (Antes de Chat GPT)*, lo cual más que gracia apunta a una gran realidad, ***codear a mano*** no es lo más productivo del mundo, pero tampoco lo más sano para un desarrollador, como ingeniero no programo a mano desde hace mucho tiempo, de hecho, solo he utilizado sql para realizar queries que voy a pasar a un orm a final de  cuentas, **Codex, Claude code, opencode...etc** son herramientas, se utilizan, pero hay tratarlas como tal, casarte con un framework, lenguaje o herramienta, es un pecado que se paga con mal desempeño. 

Dicho eso, hay que entender algo, dentro de un mundo tan cambiante como la programación, la única fuente de verdad que tenemos son los **fundamentos**, cuando dominas los fundamentos, no solo te das el lujo de adaptarte al cambio, sino que puedes definir tu trayectoria. 

--- 

Ok ya tenemos un poco contexto, mi idea en sí consta de un curso, no de **programación** sino de sus fundamentos, ***¿cuál es la diferencia?***, quien entiende los fundamentos de la programación puede pivotear  a cualquier tecnología o framework en poco tiempo, también tengo una visión un poco más arquitectónica del código y es algo que igualmente quiero compartir. Teniendo en cuenta eso, vamos hand-on con el catálogo de conocimientos. 

<summary>por cierto, para beginners, recomiendo trabajar con java, este lenguaje es el adecuado para cualquier principiante en mi opinión, pues entrar de lleno con lenguajes como python o javascript, es bloquearse ante un lenguaje de bajo o medio nivel, y utilizar lenguajes como C o C++ es demasiado tedioso, eso genera frustración en  programador de entry level, lo ideal no es buscar la mediocridad ni el perfeccionismo, es encontrar su equilibio, el cual es lo que yo llamo lo "funcional", java nos birnda eso.</summary>

* Top-down vs Bottom-up.
* datos primitivos y variables.
* flags.
* estructuras de control.
* bucles.
* funciones.
* manejo de excepciones.
* divide y vencerás.
* estructuras de datos.
* documentación.
* SOLID
* introducción a la eficiencia (notación Big O)

en cuanto al set de herramientas:

1. Instalar Java 27: [Descargar Java](https://www.oracle.com/europe/java/technologies/downloads/#jdk26-windows).
2. Instalar IntelliJ community: [Descargar IntelliJ](https://www.jetbrains.com/idea/download/?section=windows).
3. crear una cuenta de github: [Crear cuenta](https://github.com/).
4. Instalar Git: [Descargar Git](https://git-scm.com/install).

## El mejor método para aprender es haciendo:
Entonces... por ahora lo ideal es familiarizarse con los conceptos básicos y luego aplicarlos en proyectos, por eso vamos a realizar la siguiente dinámica:
1. leer los conecptos de cada set de ejercicios que dejaré asociado a cada tópico.
2. resolver los ejercicios propuestos en cada set--no seas tonto usa alguna ia para asistirte en tu inicio y si te sientes bloqueado, es natural.
3. el ejercicio parcial, se debe subir a su cuenta de github en un repositorio llamado `java-101-programming-fundamentals-<TU_NOMBRE>`--lo ideal es que te familiarices con los conventional commits.
4. cada que se suba al repo un examen por medio de git con commits, debes debes adjuntar un .md que será el archivo donde se documente lo realizado--el repositorio será una bitácora de tu progreso.

# Guía de práctica en Java: fundamentos de programación

Esta guía está pensada para estudiantes que están empezando desde cero.  
Cada tema incluye:

- una definición simple;
- por qué es importante;
- un ejercicio guía con explicación y código en Java;
- 5 ejercicios de práctica;
- 1 reto más exigente;
- 1 parcial integrador y acumulativo.

La idea es avanzar de forma progresiva: primero entender el concepto, luego practicarlo, y al final combinarlo con los temas anteriores.

---

## Antes de empezar: estructura básica de un programa Java

Antes de ver los temas, conviene entender la forma mínima de un programa Java.

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hola mundo");
    }
}
```

### ¿Qué significa `public static void main(String[] args)`?

- `public`: significa que Java puede acceder a este método desde cualquier parte.
- `static`: significa que el método pertenece a la clase y no necesitas crear un objeto para ejecutarlo.
- `void`: significa que el método no devuelve ningún valor.
- `main`: es el punto de entrada del programa. Java empieza a ejecutar desde aquí.
- `String[] args`: es un arreglo de texto que puede recibir datos desde la consola al ejecutar el programa.

### ¿Por qué importa entender esto?

Porque en casi todos los ejercicios de esta guía, el programa comenzará en `main`. Desde allí se llaman variables, decisiones, bucles, funciones y estructuras de datos.

### ¿Por qué las funciones suelen ir fuera de `main`?

En Java, los métodos normalmente se escriben dentro de una clase, pero **fuera del método `main`**. Eso se hace porque:

- `main` debe quedar limpio y corto;
- la lógica se separa en métodos reutilizables;
- cada método cumple una tarea específica;
- así el código es más ordenado y fácil de leer.

Ejemplo:

```java
public class Main {
    public static void main(String[] args) {
        saludar();
    }

    public static void saludar() {
        System.out.println("Hola estudiante");
    }
}
```

En este ejemplo, `saludar()` está fuera de `main`, pero dentro de la clase `Main`. Eso permite reutilizarlo y mantener el programa más limpio.

---

## 1. Top-down vs Bottom-up

### Definición
Top-down significa resolver un problema empezando por la idea general y dividiéndola en partes pequeñas. Bottom-up significa construir primero piezas pequeñas y luego unirlas para formar algo más grande.

### Por qué es importante
Porque ayuda a pensar antes de programar. Un buen programa no nace escribiendo código al azar; nace entendiendo cómo se divide el problema.

### Ejercicio guía
**Problema:** hacer un desayuno simple.

**Cómo pensarlo Top-down:**
1. Decidir qué desayuno se va a preparar.
2. Separar el proceso en acciones grandes: tomar utensilios, preparar alimento, servir.
3. Dividir cada acción en pasos pequeños: sacar pan, tostarlo, poner mantequilla, servir café.

**Código en Java:**

```java
public class Main {
    public static void main(String[] args) {
        prepararDesayuno();
    }

    public static void prepararDesayuno() {
        tomarUtensilios();
        prepararAlimento();
        servirBebida();
    }

    public static void tomarUtensilios() {
        System.out.println("Tomando utensilios");
    }

    public static void prepararAlimento() {
        System.out.println("Preparando pan con mantequilla");
    }

    public static void servirBebida() {
        System.out.println("Sirviendo café");
    }
}
```

### Ejercicios
1. Toma la actividad “preparar un desayuno” y descríbela en pasos generales primero, luego en pasos más pequeños.
2. Toma la actividad “organizar una mochila para ir a clase” y descompón el problema antes de pensar en código.
3. Toma “lavar un plato” y sepáralo en acciones simples.
4. Toma “hacer una llamada telefónica” y escribe primero el flujo general y después los detalles.
5. Toma “preparar una bebida” y convierte la tarea en un algoritmo paso a paso.

### Reto
6. Diseña, antes de programar, el proceso completo para “registrar una compra en una tienda pequeña”. Debes primero hacer una descripción Top-down: qué hace el sistema en general, luego qué partes lo componen, y después qué tareas concretas ejecuta cada parte.

### Parcial 1
7. Programa en Java un sistema de consola para registrar una merienda escolar.  
   El programa debe:
   - pedir el nombre del estudiante;
   - pedir qué va a comprar;
   - mostrar un resumen final;
   - permitir repetir el registro para varios estudiantes.

   Además, antes de escribir código, divide el problema en partes generales y explica cómo lo resolverías de arriba hacia abajo.

---

## 2. Datos primitivos y variables

### Definición
Los datos primitivos son los tipos básicos de información que Java maneja directamente, como `int`, `double`, `char`, `boolean` y otros. Las variables son espacios donde guardamos esos datos para usarlos después.

### Por qué es importante
Porque casi todo programa necesita guardar información: edades, precios, nombres, estados, notas y resultados. Sin variables no hay programa útil.

### Ejercicio guía
**Problema:** guardar el nombre, edad y altura de una persona.

**Pista en Java:**
- `String nombre = "Ana";`
- `int edad = 18;`
- `double altura = 1.65;`

**Código en Java:**

```java
public class Main {
    public static void main(String[] args) {
        String nombre = "Ana";
        int edad = 18;
        double altura = 1.65;

        System.out.println("Nombre: " + nombre);
        System.out.println("Edad: " + edad);
        System.out.println("Altura: " + altura);
    }
}
```

**Qué debe aprender el estudiante:**
- cada dato debe tener un tipo adecuado;
- no se guarda igual un nombre que una edad;
- el tipo correcto evita errores.

### Ejercicios
1. Guarda en variables el nombre, la edad y la altura de una persona, y muéstralos en pantalla.
2. Guarda el precio de un producto, el descuento y calcula el precio final.
3. Pide dos números enteros y muestra suma, resta, multiplicación y división.
4. Guarda un carácter y una palabra, y muéstralos juntos.
5. Guarda si una persona es mayor de edad usando un valor booleano.

### Reto
6. Crea un programa que registre los datos de un estudiante usando distintos tipos primitivos: `int`, `double`, `char`, `boolean` y `String`. El programa debe mostrar toda la información de forma ordenada.

### Parcial 2
7. Programa en Java un sistema de registro de compra simple.  
   El programa debe:
   - pedir nombre del cliente;
   - pedir edad;
   - pedir el precio de un producto;
   - pedir un porcentaje de descuento;
   - calcular el precio final;
   - mostrar un mensaje distinto si el cliente es mayor de edad.

   Debes usar correctamente datos primitivos y variables, y además integrar lo aprendido en el tema anterior sobre descomposición general del problema.

---

## 3. Flags

### Definición
Una flag es una variable que representa un estado: sí o no, verdadero o falso, encendido o apagado, encontrado o no encontrado.

### Por qué es importante
Porque permite controlar decisiones dentro del programa. Una flag ayuda a saber si algo ocurrió o si un proceso debe detenerse.

### Ejercicio guía
**Problema:** leer números hasta que el usuario escriba `0`.

**Idea:**
- crear una bandera llamada `seguir`;
- mientras sea verdadera, el programa sigue leyendo;
- cuando el usuario escriba `0`, la bandera cambia a falsa y el ciclo termina.

**Código en Java:**

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        boolean seguir = true;

        while (seguir) {
            System.out.print("Ingresa un número (0 para salir): ");
            int numero = scanner.nextInt();

            if (numero == 0) {
                seguir = false;
            } else {
                System.out.println("Ingresaste: " + numero);
            }
        }

        System.out.println("Programa terminado");
        scanner.close();
    }
}
```

### Ejercicios
1. Lee números hasta que el usuario escriba `0`; usa una bandera para detener el programa.
2. Revisa si un número está dentro de una pequeña lista y usa una flag para indicar si fue encontrado.
3. Busca la palabra `Java` en una serie de palabras y usa una bandera para marcar si apareció.
4. Valida si una contraseña ingresada coincide con una clave correcta.
5. Recorre varias edades y usa una bandera para indicar si apareció al menos un menor de edad.

### Reto
6. Recorre una lista de 10 números y usa una bandera para indicar si existe al menos un número mayor que 100. El programa debe detener el recorrido apenas encuentre el primer valor que cumpla la condición.

### Parcial 3
7. Programa en Java un mini sistema de validación de acceso.  
   El programa debe:
   - pedir un nombre de usuario;
   - pedir una contraseña;
   - permitir hasta 3 intentos;
   - usar una bandera para indicar si el acceso fue concedido;
   - mostrar un mensaje distinto si el acceso falló.

   Este parcial debe combinar lo aprendido en:
   - top-down;
   - variables;
   - flags.

---

## 4. Estructuras de control

### Definición
Las estructuras de control son las que deciden qué camino sigue el programa. Incluyen condiciones como `if`, `else`, `switch`, y permiten tomar decisiones.

### Por qué es importante
Porque un programa sin decisiones hace siempre lo mismo. Las estructuras de control le dan lógica y comportamiento útil.

### Ejercicio guía
**Problema:** decidir si un número es positivo, negativo o cero.

**Idea en Java:**
- si el número es mayor que 0, mostrar “positivo”;
- si es menor que 0, mostrar “negativo”;
- en caso contrario, mostrar “cero”.

**Código en Java:**

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Ingresa un número: ");
        int numero = scanner.nextInt();

        if (numero > 0) {
            System.out.println("Positivo");
        } else if (numero < 0) {
            System.out.println("Negativo");
        } else {
            System.out.println("Cero");
        }

        scanner.close();
    }
}
```

### Ejercicios
1. Indica si un número es positivo, negativo o cero.
2. Indica si una nota está aprobada o reprobada.
3. Decide si una persona paga entrada completa o con descuento según su edad.
4. Muestra un mensaje distinto según el día de la semana.
5. Indica si un número es par o impar, y además si es mayor que 10.

### Reto
6. Crea un menú con `switch` que permita:
   - sumar;
   - restar;
   - multiplicar;
   - dividir;
   - salir.
   El programa debe leer una opción y ejecutar la acción correspondiente.

### Parcial 4
7. Programa una calculadora básica de consola para un kiosco.  
   Debe:
   - pedir dos números;
   - pedir una operación;
   - decidir qué hacer con estructuras de control;
   - mostrar un mensaje distinto si el resultado es negativo, cero o positivo;
   - permitir repetir la operación varias veces.

   Este parcial acumula:
   - top-down;
   - variables;
   - flags;
   - estructuras de control.

---

## 5. Bucles

### Definición
Los bucles son estructuras que repiten una acción varias veces. En Java se usan para recorrer datos, repetir validaciones o ejecutar procesos repetitivos.

### Por qué es importante
Porque muchas tareas no se hacen una sola vez. Repetir código manualmente sería ineficiente y propenso a errores.

### Ejercicio guía
**Problema:** mostrar los números del 1 al 10.

**Idea:**
- usar un bucle que comience en 1;
- repetir hasta 10;
- aumentar el contador en cada vuelta.

**Código en Java:**

```java
public class Main {
    public static void main(String[] args) {
        for (int i = 1; i <= 10; i++) {
            System.out.println(i);
        }
    }
}
```

### Ejercicios
1. Muestra los números del 1 al 10.
2. Muestra los números del 10 al 1.
3. Suma los primeros 5 números naturales.
4. Imprime la tabla del 3.
5. Pide 5 notas y calcula el promedio.

### Reto
6. Pide números al usuario hasta que escriba un número negativo. Luego muestra:
   - cuántos números ingresó;
   - la suma total;
   - el promedio.

### Parcial 5
7. Programa un sistema de captura de datos para una tienda pequeña.  
   El programa debe:
   - pedir varios precios de productos;
   - permitir terminar antes con una bandera;
   - calcular subtotal;
   - contar cuántos productos se registraron;
   - mostrar el promedio de precios;
   - indicar cuál fue el precio más alto y el más bajo.

   Este parcial debe usar:
   - top-down;
   - variables;
   - flags;
   - estructuras de control;
   - bucles.

---

## 6. Funciones

### Definición
Una función es un bloque de código que realiza una tarea concreta y puede reutilizarse cuando se necesite.

### Por qué es importante
Porque evita repetir código, mejora el orden del programa y hace que cada parte tenga un propósito claro.

### Explicación de sintaxis y ubicación
En Java, una función se escribe como un método dentro de una clase, pero fuera del `main`.

Ejemplo:

```java
public class Main {
    public static void main(String[] args) {
        saludar();
    }

    public static void saludar() {
        System.out.println("Hola estudiante");
    }
}
```

### Partes básicas de una función
- `public`: indica que puede llamarse desde otras partes.
- `static`: permite llamarla sin crear un objeto.
- `void`: significa que no devuelve nada.
- `saludar`: nombre del método.
- `()`: aquí van los parámetros, si los hay.
- `{}`: contiene el bloque de instrucciones.

### ¿Por qué van fuera de `main`?
Porque `main` debe ser solo el punto de arranque. Las funciones fuera de `main` permiten organizar el programa en partes pequeñas, reutilizables y fáciles de entender.

### Ejercicio guía
**Problema:** crear una función que sume dos números.

**Idea:**
- recibir dos parámetros;
- devolver la suma;
- llamar la función desde `main`.

**Código en Java:**

```java
public class Main {
    public static void main(String[] args) {
        int resultado = sumar(5, 3);
        System.out.println("Resultado: " + resultado);
    }

    public static int sumar(int a, int b) {
        return a + b;
    }
}
```

### Ejercicios
1. Crea una función que sume dos números.
2. Crea una función que diga si un número es par.
3. Crea una función que reciba un nombre y lo salude.
4. Crea una función que calcule el área de un rectángulo.
5. Crea una función que devuelva el mayor de dos números.

### Reto
6. Crea una pequeña calculadora modular donde cada operación sea una función independiente.

### Parcial 6
7. Programa una calculadora de consola estructurada por funciones.  
   Debe:
   - pedir dos números;
   - pedir una operación;
   - ejecutar la operación usando una función;
   - repetir el proceso varias veces;
   - manejar al menos una validación básica de entrada.

   Este parcial acumula:
   - top-down;
   - variables;
   - flags;
   - estructuras de control;
   - bucles;
   - funciones.

---

## 7. Manejo de excepciones

### Definición
Las excepciones son errores que pueden aparecer mientras el programa se ejecuta. Manejar excepciones significa evitar que el programa se caiga y responder de forma controlada.

### Por qué es importante
Porque los usuarios cometen errores, ingresan datos inválidos o trabajan con situaciones inesperadas. Un programa serio debe saber responder sin romperse.

### Ejercicio guía
**Problema:** dividir entre cero.

**Idea:**
- intentar la división;
- si el divisor es cero, mostrar un mensaje claro;
- continuar el programa sin cerrarlo abruptamente.

**Código en Java:**

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.print("Ingresa el numerador: ");
        int numerador = scanner.nextInt();

        System.out.print("Ingresa el divisor: ");
        int divisor = scanner.nextInt();

        try {
            int resultado = numerador / divisor;
            System.out.println("Resultado: " + resultado);
        } catch (ArithmeticException e) {
            System.out.println("No se puede dividir entre cero");
        }

        scanner.close();
    }
}
```

### Ejercicios
1. Evita que el programa falle al dividir entre cero.
2. Captura el error cuando el usuario escribe letras en vez de un número.
3. Pide una posición de una lista y maneja el caso en que se salga del rango.
4. Intenta leer un archivo que no existe y muestra un mensaje claro.
5. Crea una excepción personalizada cuando un número sea negativo.

### Reto
6. Haz un programa que intente 3 veces pedir un número válido. Si el usuario falla, debe mostrar un mensaje final y terminar correctamente.

### Parcial 7
7. Programa un sistema simple de retiro de dinero.  
   El programa debe:
   - pedir el saldo disponible;
   - pedir el monto a retirar;
   - impedir retirar más de lo disponible;
   - capturar errores de entrada;
   - evitar divisiones inválidas si las usas en cálculos;
   - usar una excepción personalizada si el monto es negativo.

   Este parcial acumula:
   - top-down;
   - variables;
   - flags;
   - estructuras de control;
   - bucles;
   - funciones;
   - manejo de excepciones.

---

## 8. Divide y vencerás

### Definición
Divide y vencerás es una forma de resolver problemas partiendo un problema grande en partes más pequeñas, resolviendo cada parte y luego uniendo los resultados.

### Por qué es importante
Porque muchos algoritmos eficientes nacen de esta idea. También ayuda a pensar con más orden cuando un problema parece demasiado grande.

### Ejercicio guía
**Problema:** encontrar el número mayor de una lista.

**Idea:**
- dividir la lista en dos partes;
- hallar el mayor de cada parte;
- comparar ambos resultados.

**Código en Java:**

```java
public class Main {
    public static void main(String[] args) {
        int[] numeros = {4, 8, 2, 10, 6};
        int mayor = encontrarMayor(numeros, 0, numeros.length - 1);
        System.out.println("Mayor: " + mayor);
    }

    public static int encontrarMayor(int[] numeros, int inicio, int fin) {
        if (inicio == fin) {
            return numeros[inicio];
        }

        int medio = (inicio + fin) / 2;
        int mayorIzq = encontrarMayor(numeros, inicio, medio);
        int mayorDer = encontrarMayor(numeros, medio + 1, fin);

        return Math.max(mayorIzq, mayorDer);
    }
}
```

### Ejercicios
1. Encuentra el número mayor de una lista dividiéndola en dos partes.
2. Busca un número en una lista ordenada usando búsqueda binaria.
3. Ordena una lista pequeña separándola y uniendo partes.
4. Suma una lista dividiéndola en mitades.
5. Encuentra el mínimo y el máximo de una lista usando división recursiva.

### Reto
6. Cuenta cuántas veces aparece un número en una lista separando el problema en subproblemas más pequeños.

### Parcial 8
7. Programa en Java una solución para buscar y ordenar datos de una lista de enteros.  
   El programa debe:
   - permitir ingresar varios números;
   - ordenar la lista con una estrategia divide y vencerás;
   - buscar un número específico;
   - mostrar el valor mínimo y máximo;
   - contar cuántas veces aparece un valor dado.

   Este parcial acumula:
   - todo lo anterior;
   - y añade el uso de enfoque divide y vencerás.

---

## 9. Estructuras de datos

### Definición
Las estructuras de datos son formas de organizar la información en memoria para poder guardarla, buscarla, recorrerla o modificarla de manera eficiente.

### Por qué es importante
Porque no todos los problemas se resuelven con una sola variable. A veces necesitas listas, colas, pilas, conjuntos o mapas según el objetivo.

### Ejercicio guía
**Problema:** guardar nombres de estudiantes.

**Idea:**
- usar una lista para almacenar varios nombres;
- recorrer la lista para mostrarlos;
- agregar o eliminar elementos según se necesite.

**Código en Java:**

```java
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        ArrayList<String> estudiantes = new ArrayList<>();
        estudiantes.add("Ana");
        estudiantes.add("Luis");
        estudiantes.add("Marta");

        for (String estudiante : estudiantes) {
            System.out.println(estudiante);
        }
    }
}
```

### Ejercicios
1. Guarda 5 nombres en una lista y muéstralos.
2. Usa una pila para simular una acción de deshacer.
3. Usa una cola para atender personas en orden de llegada.
4. Guarda palabras y cuenta cuántas veces aparece cada una.
5. Guarda números sin repetirlos.

### Reto
6. Crea una lista de tareas pendientes y permite agregar, mostrar y eliminar tareas.

### Parcial 9
7. Programa un gestor simple de notas de estudiantes.  
   El programa debe:
   - permitir guardar estudiantes;
   - guardar notas por estudiante;
   - evitar nombres repetidos;
   - mostrar estudiantes en orden de llegada;
   - permitir eliminar al último agregado;
   - contar cuántas veces aparece una nota determinada.

   Este parcial acumula:
   - todos los temas anteriores;
   - y añade estructuras de datos como lista, cola, pila, conjunto y mapa, según convenga.

---

## 10. Documentación

### Definición
Documentar significa explicar el código para que otra persona pueda entender qué hace, cómo se usa y por qué está escrito así.

### Por qué es importante
Porque el código no solo se escribe para que funcione, también para que pueda mantenerse, corregirse y entenderse después.

### Ejercicio guía
**Problema:** documentar una calculadora simple.

**Idea:**
- comentar qué hace cada método;
- explicar la entrada y salida;
- usar JavaDoc en clases y funciones principales.

**Código en Java:**

```java
/**
 * Calcula el área de un círculo.
 * @param radio valor del radio
 * @return área del círculo
 */
public static double calcularAreaCirculo(double radio) {
    return Math.PI * radio * radio;
}
```

### Ejercicios
1. Escribe comentarios claros en un programa que sume dos números.
2. Documenta una clase simple llamada `Persona`.
3. Explica con comentarios qué hace cada método de una calculadora.
4. Escribe JavaDoc para una función que calcule el área de un círculo.
5. Crea un `README` corto que explique cómo ejecutar un programa de consola.

### Reto
6. Toma un programa simple y déjalo tan claro que otra persona pueda entenderlo sin preguntarte nada.

### Parcial 10
7. Toma uno de los programas anteriores y documenta todo correctamente.  
   Debe incluir:
   - comentarios útiles;
   - JavaDoc en clases y métodos;
   - un `README` con instrucciones de ejecución;
   - explicación breve del propósito del programa.

   Este parcial acumula:
   - todo lo anterior;
   - y exige que el código ya sea entendible para otra persona.

---

## 11. SOLID

### Definición
SOLID es un conjunto de cinco principios de diseño orientados a crear software más limpio, flexible y fácil de mantener.

### Por qué es importante
Porque ayuda a evitar clases enormes, código rígido y programas difíciles de extender.

### Ejercicio guía
**Problema:** una clase que hace demasiadas cosas.

**Idea:**
- separar responsabilidades;
- dejar que cada clase haga una sola tarea;
- depender de interfaces en lugar de clases concretas.

**Código en Java:**

```java
public class Calculadora {
    public static int sumar(int a, int b) {
        return a + b;
    }
}
```

En este ejemplo la clase tiene una sola responsabilidad: sumar.

### Ejercicios
1. Crea una clase que haga solo una cosa: sumar números.
2. Separa una clase que imprima datos de otra que los calcule.
3. Haz que una operación nueva pueda agregarse sin modificar mucho el código anterior.
4. Divide una interfaz grande en partes pequeñas.
5. Haz que una clase dependa de una abstracción y no de una clase concreta.

### Reto
6. Toma una clase mal hecha y sepárala en piezas más simples, intentando que cada parte tenga una responsabilidad clara.

### Parcial 11
7. Refactoriza un sistema simple de biblioteca o tienda.  
   El programa debe:
   - tener clases con responsabilidades separadas;
   - permitir agregar nuevas acciones sin romper lo existente;
   - usar interfaces pequeñas y útiles;
   - depender de abstracciones;
   - ser compatible con el reemplazo de componentes sin cambiar el comportamiento principal.

   Este parcial acumula:
   - todo lo anterior;
   - y exige diseño limpio con principios SOLID.

---

## 12. Introducción a la eficiencia (notación Big O)

### Definición
Big O es una forma de describir cómo crece el costo de un algoritmo cuando crece la cantidad de datos. Ayuda a entender si un programa será rápido o lento al escalar.

### Por qué es importante
Porque no basta con que un programa funcione. También debe funcionar bien cuando hay muchos datos.

### Ejercicio guía
**Problema:** comparar dos formas de buscar un número.

**Idea:**
- una búsqueda revisa todos los elementos;
- otra se detiene antes si la lista está ordenada;
- comparar cuál hace menos trabajo.

**Código en Java:**

```java
public class Main {
    public static void main(String[] args) {
        int[] numeros = {2, 5, 8, 10, 15, 20};
        int objetivo = 10;

        int pasosLineal = busquedaLineal(numeros, objetivo);
        int pasosBinaria = busquedaBinaria(numeros, objetivo);

        System.out.println("Pasos búsqueda lineal: " + pasosLineal);
        System.out.println("Pasos búsqueda binaria: " + pasosBinaria);
    }

    public static int busquedaLineal(int[] numeros, int objetivo) {
        int pasos = 0;
        for (int numero : numeros) {
            pasos++;
            if (numero == objetivo) {
                break;
            }
        }
        return pasos;
    }

    public static int busquedaBinaria(int[] numeros, int objetivo) {
        int pasos = 0;
        int inicio = 0;
        int fin = numeros.length - 1;

        while (inicio <= fin) {
            pasos++;
            int medio = (inicio + fin) / 2;
            if (numeros[medio] == objetivo) {
                return pasos;
            } else if (numeros[medio] < objetivo) {
                inicio = medio + 1;
            } else {
                fin = medio - 1;
            }
        }

        return pasos;
    }
}
```

### Ejercicios
1. Compara una búsqueda que revisa todos los elementos con otra que se detiene antes.
2. Revisa cuántas veces se repite un ciclo simple frente a dos ciclos anidados.
3. Compara sumar una lista completa con sumar solo un elemento.
4. Analiza qué pasa cuando duplicas el tamaño de una lista.
5. Compara buscar en una lista ordenada y en una lista desordenada.

### Reto
6. Toma dos soluciones al mismo problema y explica cuál parece más rápida y por qué.

### Parcial 12
7. Programa dos formas distintas de resolver el mismo problema en Java y compáralas.  
   El programa debe:
   - buscar un valor en una lista;
   - hacerlo de forma lineal;
   - hacerlo de forma más eficiente cuando la lista esté ordenada;
   - medir o estimar la diferencia de pasos;
   - explicar cuál solución conviene más según el tamaño de los datos.

   Este parcial acumula:
   - todo lo anterior;
   - y obliga a pensar en eficiencia real, no solo en que “funcione”.

---

## Uso sugerido de esta guía

- Lee primero la definición de cada tema.
- Estudia el ejercicio guía y su código antes de intentar los demás.
- Luego haz los 5 ejercicios.
- Después intenta el reto.
- Finalmente resuelve el parcial sin mirar soluciones.

La dificultad está diseñada para crecer de forma acumulativa, así que cada parcial debe sentirse más exigente que el anterior.
