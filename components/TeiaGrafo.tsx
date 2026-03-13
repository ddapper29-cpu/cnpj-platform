"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { TeiaData, TeiaNode } from "@/app/api/teia/[cnpj]/route";

interface Props {
  cnpjInicial: string;
  maxCamadas: number;
}

export default function TeiaGrafo({ cnpjInicial, maxCamadas }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cyRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [camadaAtual, setCamadaAtual] = useState(1);
  const [limiteAtingido, setLimiteAtingido] = useState(false);
  const [nodeSelecionado, setNodeSelecionado] = useState<TeiaNode | null>(null);

  const carregarTeia = useCallback(
    async (cnpj: string, camada: number) => {
      setLoading(true);
      setErro("");
      try {
        const res = await fetch(`/api/teia/${cnpj}?camada=${camada}`);
        if (res.status === 401) {
          setErro("Faça login para visualizar a teia de relacionamentos.");
          return;
        }
        if (res.status === 403) {
          setErro("Limite de 2 teias/mês atingido. Faça upgrade para o plano Pro.");
          setLimiteAtingido(true);
          return;
        }
        if (!res.ok) throw new Error("Erro ao carregar teia.");
        const data: TeiaData = await res.json();
        setLimiteAtingido(data.limiteAtingido ?? false);
        renderizarGrafo(data);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro inesperado.");
      } finally {
        setLoading(false);
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderizarGrafo(data: TeiaData) {
    if (!containerRef.current) return;

    import("cytoscape").then((cytoscapeModule) => {
      const cytoscape = cytoscapeModule.default;

      if (cyRef.current) cyRef.current.destroy();

      const elements = [
        ...data.nodes.map((n) => ({
          data: {
            id: n.id,
            label: n.label.length > 25 ? n.label.slice(0, 25) + "…" : n.label,
            fullLabel: n.label,
            tipo: n.tipo,
            cnpj: n.cnpj,
            situacao: n.situacao,
          },
        })),
        ...data.edges.map((e, i) => ({
          data: {
            id: `e${i}`,
            source: e.source,
            target: e.target,
            label: e.label,
          },
        })),
      ];

      cyRef.current = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: "node[tipo='empresa']",
            style: {
              "background-color": "#2563eb",
              "border-color": "#3b82f6",
              "border-width": 2,
              label: "data(label)",
              color: "#fff",
              "font-size": "11px",
              "text-valign": "bottom",
              "text-margin-y": 6,
              width: 40,
              height: 40,
              "text-wrap": "wrap",
              "text-max-width": "100px",
            },
          },
          {
            selector: "node[tipo='pessoa']",
            style: {
              "background-color": "#059669",
              "border-color": "#10b981",
              "border-width": 2,
              label: "data(label)",
              color: "#fff",
              "font-size": "11px",
              "text-valign": "bottom",
              "text-margin-y": 6,
              width: 36,
              height: 36,
              shape: "ellipse",
              "text-wrap": "wrap",
              "text-max-width": "100px",
            },
          },
          {
            selector: `node[id='${cnpjInicial}']`,
            style: {
              "background-color": "#7c3aed",
              "border-color": "#a78bfa",
              "border-width": 3,
              width: 50,
              height: 50,
            },
          },
          {
            selector: "node:selected",
            style: {
              "border-color": "#f59e0b",
              "border-width": 3,
            },
          },
          {
            selector: "edge",
            style: {
              width: 1.5,
              "line-color": "#3f3f46",
              "target-arrow-color": "#3f3f46",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              label: "data(label)",
              "font-size": "9px",
              color: "#71717a",
              "text-rotation": "autorotate",
            },
          },
        ],
        layout: { name: "cose", animate: true, padding: 40, nodeRepulsion: 8000 },
        userZoomingEnabled: true,
        userPanningEnabled: true,
        minZoom: 0.3,
        maxZoom: 3,
      });

      // Clique em nó: mostra info e expande se for empresa
      cyRef.current.on("tap", "node", (evt: any) => {
        const node = evt.target;
        const nodeData: TeiaNode = {
          id: node.id(),
          label: node.data("fullLabel"),
          tipo: node.data("tipo"),
          cnpj: node.data("cnpj"),
          situacao: node.data("situacao"),
        };
        setNodeSelecionado(nodeData);
      });

      cyRef.current.on("tap", (evt: any) => {
        if (evt.target === cyRef.current) setNodeSelecionado(null);
      });
    });
  }

  useEffect(() => {
    carregarTeia(cnpjInicial, 1);
  }, [cnpjInicial, carregarTeia]);

  const expandirCamada = useCallback(
    async (cnpj: string) => {
      if (camadaAtual >= maxCamadas || limiteAtingido) return;
      const novaCamada = camadaAtual + 1;
      setCamadaAtual(novaCamada);

      const res = await fetch(`/api/teia/${cnpj}?camada=${novaCamada}`);
      if (!res.ok) return;
      const data: TeiaData = await res.json();
      setLimiteAtingido(data.limiteAtingido ?? false);

      if (!cyRef.current) return;

      // Adiciona novos nós/arestas sem resetar o grafo
      const novosElementos = [
        ...data.nodes
          .filter((n) => !cyRef.current.getElementById(n.id).length)
          .map((n) => ({
            group: "nodes" as const,
            data: {
              id: n.id,
              label: n.label.length > 25 ? n.label.slice(0, 25) + "…" : n.label,
              fullLabel: n.label,
              tipo: n.tipo,
              cnpj: n.cnpj,
              situacao: n.situacao,
            },
          })),
        ...data.edges.map((e, i) => ({
          group: "edges" as const,
          data: { id: `exp-${novaCamada}-${i}`, source: e.source, target: e.target, label: e.label },
        })),
      ];

      cyRef.current.add(novosElementos);
      cyRef.current.layout({ name: "cose", animate: true, padding: 40 }).run();
    },
    [camadaAtual, maxCamadas, limiteAtingido]
  );

  const exportarPNG = useCallback(() => {
    if (!cyRef.current) return;
    const png = cyRef.current.png({ scale: 2, full: true, bg: "#09090b" });
    const a = document.createElement("a");
    a.href = png;
    a.download = `teia-${cnpjInicial}.png`;
    a.click();
  }, [cnpjInicial]);

  if (erro) {
    return (
      <div className="card text-center py-12">
        <p className="text-4xl mb-4">⚠️</p>
        <p className="text-zinc-300 mb-4">{erro}</p>
        {limiteAtingido && (
          <a href="/planos" className="btn-primary inline-block">
            Ver planos
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-violet-600 inline-block" /> Empresa consultada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Empresa
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" /> Pessoa física
          </span>
        </div>
        <div className="flex gap-2">
          {nodeSelecionado?.cnpj && nodeSelecionado.cnpj !== cnpjInicial && !limiteAtingido && camadaAtual < maxCamadas && (
            <button
              onClick={() => expandirCamada(nodeSelecionado.cnpj!)}
              className="btn-secondary text-sm"
            >
              + Expandir nó
            </button>
          )}
          <button onClick={exportarPNG} className="btn-secondary text-sm">
            ⬇ Exportar PNG
          </button>
        </div>
      </div>

      {/* Grafo */}
      <div className="relative card p-0 overflow-hidden" style={{ height: 520 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 z-10">
            <div className="text-center">
              <span className="w-8 h-8 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin inline-block mb-3" />
              <p className="text-sm text-zinc-400">Montando a teia…</p>
            </div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Painel do nó selecionado */}
      {nodeSelecionado && (
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-zinc-500 mb-1">
                {nodeSelecionado.tipo === "empresa" ? "Empresa" : "Pessoa física"}
              </p>
              <p className="font-semibold text-white">{nodeSelecionado.label}</p>
              {nodeSelecionado.cnpj && (
                <p className="text-xs text-zinc-500 font-mono mt-0.5">{nodeSelecionado.cnpj}</p>
              )}
              {nodeSelecionado.situacao && (
                <p className="text-xs text-zinc-400 mt-1">Situação: {nodeSelecionado.situacao}</p>
              )}
            </div>
            {nodeSelecionado.cnpj && (
              <a
                href={`/cnpj/${nodeSelecionado.cnpj}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs shrink-0"
              >
                Ver empresa →
              </a>
            )}
          </div>
        </div>
      )}

      {limiteAtingido && (
        <div className="card border-amber-800 bg-amber-950/30 text-center">
          <p className="text-amber-300 text-sm">
            Limite de camadas atingido para seu plano.{" "}
            <a href="/planos" className="underline hover:text-amber-200">
              Faça upgrade para expandir mais.
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
