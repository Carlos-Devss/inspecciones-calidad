"use client";

import { useRef, useState, type FormEvent } from "react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Field, MensajeError } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Panel, PanelTitulo } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import {
  crearInspeccionSchema,
  erroresPorCampo,
  fechaDeHoy,
  type CrearInspeccion,
} from "@/shared/inspeccion.schema";
import type {
  InspeccionClasificada,
  Producto,
} from "@/shared/inspeccion.types";
import { crearInspeccion } from "./api-client";

// Orden visual de los campos: define a cuál se lleva el foco si hay errores.
const CAMPOS = [
  "productoCodigo",
  "lote",
  "fecha",
  "unidadesRevisadas",
  "unidadesDefectuosas",
] as const;

type Campo = (typeof CAMPOS)[number];
// Lo que hay escrito en cada control, siempre como texto.
type Valores = Record<Campo, string>;
type Errores = Partial<Record<Campo, string>>;

// Al cambiar un campo se revisan también los que dependen de él: la regla
// "defectuosas ≤ revisadas" vive en el campo de defectuosas.
const DEPENDIENTES: Record<Campo, Campo[]> = {
  productoCodigo: ["productoCodigo"],
  lote: ["lote"],
  fecha: ["fecha"],
  unidadesRevisadas: ["unidadesRevisadas", "unidadesDefectuosas"],
  unidadesDefectuosas: ["unidadesDefectuosas"],
};

export const ID_CAMPO_PRODUCTO = "inspeccion-producto";

const MENSAJE_FALLO =
  "No se pudo guardar la inspección. Revisa tu conexión e inténtalo de nuevo.";

// Vacío (o solo espacios) es "sin dato", nunca 0: así el esquema lo marca
// como obligatorio. Cualquier otro texto pasa por Number y, si no es un
// número ("12a" → NaN), el esquema lo rechaza.
function aNumero(texto: string): number | undefined {
  const limpio = texto.trim();
  return limpio === "" ? undefined : Number(limpio);
}

function validar(valores: Valores): {
  datos?: CrearInspeccion;
  errores: Errores;
} {
  const resultado = crearInspeccionSchema.safeParse({
    productoCodigo: valores.productoCodigo,
    lote: valores.lote,
    fecha: valores.fecha,
    unidadesRevisadas: aNumero(valores.unidadesRevisadas),
    unidadesDefectuosas: aNumero(valores.unidadesDefectuosas),
  });
  return resultado.success
    ? { datos: resultado.data, errores: {} }
    : { errores: soloCampos(erroresPorCampo(resultado.error)) };
}

function soloCampos(campos: Record<string, string>): Errores {
  const errores: Errores = {};
  for (const campo of CAMPOS) {
    if (campos[campo]) errores[campo] = campos[campo];
  }
  return errores;
}

type Props = {
  productos: Producto[];
  estadoProductos: "cargando" | "listo" | "error";
  onReintentarProductos: () => void;
  onGuardada: (inspeccion: InspeccionClasificada) => void;
};

export function FormularioInspeccion({
  productos,
  estadoProductos,
  onReintentarProductos,
  onGuardada,
}: Props) {
  const [valores, setValores] = useState<Valores>(() => ({
    productoCodigo: "",
    lote: "",
    fecha: fechaDeHoy(),
    unidadesRevisadas: "",
    unidadesDefectuosas: "",
  }));
  // Campos que el usuario ya modificó: solo esos muestran su error al salir.
  const [tocados, setTocados] = useState<Partial<Record<Campo, true>>>({});
  // Errores visibles (no todos los que hay: un campo sin tocar no regaña).
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  // El estado tarda un render en actualizarse; la ref bloquea un segundo
  // envío inmediato (doble clic o Enter repetido).
  const enviando = useRef(false);
  const controles = useRef<
    Partial<Record<Campo, HTMLInputElement | HTMLSelectElement | null>>
  >({});

  const hoy = fechaDeHoy();

  function registrar(campo: Campo) {
    return (elemento: HTMLInputElement | HTMLSelectElement | null) => {
      controles.current[campo] = elemento;
    };
  }

  function enfocarPrimerError(lista: Errores) {
    const primero = CAMPOS.find((campo) => lista[campo]);
    if (primero) controles.current[primero]?.focus();
  }

  function cambiar(campo: Campo, valor: string) {
    const nuevos = { ...valores, [campo]: valor };
    setValores(nuevos);
    setTocados((anteriores) => ({ ...anteriores, [campo]: true }));

    // Un error visible se actualiza mientras se escribe y desaparece en
    // cuanto el valor es válido. Uno nuevo no aparece hasta salir del campo.
    const actuales = validar(nuevos).errores;
    setErrores((visibles) => {
      const siguientes = { ...visibles };
      for (const revisar of DEPENDIENTES[campo]) {
        if (!siguientes[revisar]) continue;
        if (actuales[revisar]) siguientes[revisar] = actuales[revisar];
        else delete siguientes[revisar];
      }
      return siguientes;
    });
  }

  function salir(campo: Campo) {
    if (!tocados[campo]) return;
    // Se revisan todos los campos tocados y no solo el que se deja: al
    // cambiar revisadas puede aparecer el error cruzado en defectuosas.
    const actuales = validar(valores).errores;
    setErrores((visibles) => {
      const siguientes = { ...visibles };
      for (const revisar of CAMPOS) {
        if (tocados[revisar] && actuales[revisar]) {
          siguientes[revisar] = actuales[revisar];
        }
      }
      return siguientes;
    });
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando.current) return;

    setFallo(null);
    const { datos, errores: actuales } = validar(valores);
    if (!datos) {
      setErrores(actuales);
      setTocados(Object.fromEntries(CAMPOS.map((c) => [c, true])));
      enfocarPrimerError(actuales);
      return;
    }

    enviando.current = true;
    setGuardando(true);
    const respuesta = await crearInspeccion(datos);
    enviando.current = false;
    setGuardando(false);

    if (respuesta.tipo === "guardada") {
      // Se conservan producto y fecha: lo normal es capturar varios lotes
      // del mismo producto el mismo día.
      setValores((anteriores) => ({
        ...anteriores,
        lote: "",
        unidadesRevisadas: "",
        unidadesDefectuosas: "",
      }));
      setTocados({});
      setErrores({});
      controles.current.lote?.focus();
      onGuardada(respuesta.inspeccion);
    } else if (respuesta.tipo === "validacion") {
      const delServidor = soloCampos(respuesta.campos);
      setErrores(delServidor);
      if (respuesta.campos.general) setFallo(respuesta.campos.general);
      enfocarPrimerError(delServidor);
    } else {
      setFallo(MENSAJE_FALLO);
    }
  }

  return (
    <Panel aria-labelledby="titulo-formulario" className="p-4 sm:p-5">
      <PanelTitulo id="titulo-formulario">Nueva inspección</PanelTitulo>

      <form noValidate onSubmit={enviar} className="mt-4 flex flex-col gap-4">
        {fallo && <Banner>{fallo}</Banner>}

        <Field
          id={ID_CAMPO_PRODUCTO}
          etiqueta="Producto"
          error={errores.productoCodigo}
        >
          {(control) => (
            <Select
              {...control}
              ref={registrar("productoCodigo")}
              value={valores.productoCodigo}
              onChange={(e) => cambiar("productoCodigo", e.target.value)}
              onBlur={() => salir("productoCodigo")}
              disabled={estadoProductos === "cargando"}
            >
              <option value="">
                {estadoProductos === "cargando"
                  ? "Cargando productos…"
                  : "Selecciona un producto"}
              </option>
              {productos.map((producto) => (
                <option key={producto.codigo} value={producto.codigo}>
                  {producto.codigo} {producto.nombre}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {estadoProductos === "error" && (
          <div className="-mt-2 flex flex-wrap items-center gap-x-2">
            <MensajeError>No se pudieron cargar los productos.</MensajeError>
            <Button
              variante="sutil"
              className="h-8 underline underline-offset-4"
              onClick={onReintentarProductos}
            >
              Reintentar
            </Button>
          </div>
        )}

        <Field id="inspeccion-lote" etiqueta="Lote" error={errores.lote}>
          {(control) => (
            <Input
              {...control}
              ref={registrar("lote")}
              type="text"
              autoComplete="off"
              placeholder="L-2026-142"
              value={valores.lote}
              onChange={(e) => cambiar("lote", e.target.value)}
              onBlur={() => salir("lote")}
            />
          )}
        </Field>

        <Field id="inspeccion-fecha" etiqueta="Fecha" error={errores.fecha}>
          {(control) => (
            <Input
              {...control}
              ref={registrar("fecha")}
              type="date"
              max={hoy}
              value={valores.fecha}
              onChange={(e) => cambiar("fecha", e.target.value)}
              onBlur={() => salir("fecha")}
            />
          )}
        </Field>

        {/* Texto con teclado numérico: sin flechas del navegador y sin que
            la rueda del mouse cambie el valor por accidente. */}
        <Field
          id="inspeccion-revisadas"
          etiqueta="Unidades revisadas"
          error={errores.unidadesRevisadas}
        >
          {(control) => (
            <Input
              {...control}
              ref={registrar("unidadesRevisadas")}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={valores.unidadesRevisadas}
              onChange={(e) => cambiar("unidadesRevisadas", e.target.value)}
              onBlur={() => salir("unidadesRevisadas")}
            />
          )}
        </Field>

        <Field
          id="inspeccion-defectuosas"
          etiqueta="Unidades defectuosas"
          error={errores.unidadesDefectuosas}
        >
          {(control) => (
            <Input
              {...control}
              ref={registrar("unidadesDefectuosas")}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={valores.unidadesDefectuosas}
              onChange={(e) => cambiar("unidadesDefectuosas", e.target.value)}
              onBlur={() => salir("unidadesDefectuosas")}
            />
          )}
        </Field>

        <Button type="submit" cargando={guardando} className="mt-1 w-full">
          {guardando ? "Guardando…" : "Guardar inspección"}
        </Button>
      </form>
    </Panel>
  );
}
