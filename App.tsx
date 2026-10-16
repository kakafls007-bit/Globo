import { useCallback, useEffect, useRef, useState } from "react"
import Icon from "./Icon"
import {
  architectureLayers,
  initialScripts,
  requirements,
  type Script,
} from "./data"

type Page = "console" | "scripts" | "requirements" | "architecture"
const navigation = [
  { id: "console", label: "Console de operação", icon: "monitor" },
  { id: "scripts", label: "Meus roteiros", icon: "document" },
  { id: "requirements", label: "Requisitos", icon: "requirements" },
  { id: "architecture", label: "Arquitetura & segurança", icon: "shield" },
] as const
const storageKey = "tp-autopilot-scripts-v2"
function loadScripts(): Script[] {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(storageKey) || "null",
    )
    if (
      Array.isArray(parsed) &&
      parsed.length &&
      parsed.every(
        (s) =>
          typeof s.id === "string" &&
          typeof s.title === "string" &&
          typeof s.presenter === "string" &&
          Array.isArray(s.blocks) &&
          s.blocks.length &&
          s.blocks.every(
            (b: Record<string, unknown>) =>
              typeof b.id === "string" &&
              typeof b.title === "string" &&
              typeof b.type === "string" &&
              typeof b.text === "string",
          ),
      )
    )
      return parsed
  } catch {
    /* Unavailable storage must not prevent manual operation. */
  }
  return initialScripts
}
function timeLabel(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`
}

export default function App() {
  const [page, setPage] = useState<Page>("console")
  const [scripts, setScripts] = useState<Script[]>(loadScripts)
  const [scriptId, setScriptId] = useState(scripts[0].id)
  const [blockIndex, setBlockIndex] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(32)
  const [fontSize, setFontSize] = useState(32)
  const [mirrorX, setMirrorX] = useState(false)
  const [mirrorY, setMirrorY] = useState(false)
  const [presenter, setPresenter] = useState(false)
  const [editor, setEditor] = useState<Script | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [settings, setSettings] = useState(false)
  const [toast, setToast] = useState("")
  const [saveError, setSaveError] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [query, setQuery] = useState("")
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false])
  const [activeDoc, setActiveDoc] = useState("pipeline")
  const viewport = useRef<HTMLDivElement>(null)
  const player = useRef<HTMLElement>(null)
  const frame = useRef(0)
  const scrollPosition = useRef(0)
  const script = scripts.find((s) => s.id === scriptId) || scripts[0]
  const block = script.blocks[Math.min(blockIndex, script.blocks.length - 1)]
  const words = script.blocks.reduce(
    (sum, b) => sum + b.text.trim().split(/\s+/).length,
    0,
  )
  const notify = useCallback((message: string) => setToast(message), [])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(scripts))
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
  }, [scripts])
  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(""), 4500)
    return () => window.clearTimeout(timeout)
  }, [toast])
  useEffect(() => {
    setRunning(false)
    setElapsed(0)
    scrollPosition.current = 0
    if (viewport.current) viewport.current.scrollTop = 0
  }, [scriptId, blockIndex])
  useEffect(() => {
    if (!running) return
    const interval = window.setInterval(() => setElapsed((v) => v + 1), 1000)
    let last = performance.now()
    const tick = (now: number) => {
      const element = viewport.current
      if (element) {
        scrollPosition.current += (speed * Math.min(now - last, 80)) / 1000
        element.scrollTop = scrollPosition.current
        if (
          element.scrollTop >=
          element.scrollHeight - element.clientHeight - 1
        ) {
          setRunning(false)
          notify("Fim do bloco. Selecione o próximo para continuar.")
          return
        }
      }
      last = now
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => {
      clearInterval(interval)
      cancelAnimationFrame(frame.current)
    }
  }, [running, speed, presenter, notify])

  const selectBlock = useCallback(
    (index: number) => {
      if (index >= 0 && index < script.blocks.length) {
        setRunning(false)
        setBlockIndex(index)
      }
    },
    [script.blocks.length],
  )
  const manualScroll = useCallback((delta: number) => {
    setRunning(false)
    const el = viewport.current
    if (el) {
      el.scrollTop += delta
      scrollPosition.current = el.scrollTop
    }
  }, [])
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        editor ||
        settings ||
        deleteId ||
        (page !== "console" && !presenter) ||
        (event.target instanceof HTMLElement &&
          event.target.closest("input,textarea,select,button"))
      )
        return
      if (event.code === "Space") {
        event.preventDefault()
        setRunning((v) => !v)
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault()
        manualScroll(event.key === "ArrowDown" ? 65 : -65)
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        selectBlock(blockIndex + 1)
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        selectBlock(blockIndex - 1)
      }
      if (event.key === "Escape") {
        setPresenter(false)
        setRunning(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [
    editor,
    settings,
    deleteId,
    page,
    presenter,
    manualScroll,
    selectBlock,
    blockIndex,
  ])
  useEffect(() => {
    if (!editor && !settings && !deleteId) return
    const previous = document.activeElement as HTMLElement | null
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input,textarea,select,[tabindex="0"]',
        ) || [],
      )
    focusable()[0]?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditor(null)
        setSettings(false)
        setDeleteId(null)
      }
      if (e.key === "Tab") {
        const items = focusable()
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener("keydown", handler)
    return () => {
      document.removeEventListener("keydown", handler)
      previous?.focus()
    }
  }, [!!editor, settings, deleteId])

  const changePage = (next: Page) => {
    setRunning(false)
    scrollPosition.current = 0
    setElapsed(0)
    setPage(next)
  }
  const chooseScript = (id: string) => {
    setRunning(false)
    setScriptId(id)
    setBlockIndex(0)
  }
  const edit = (value: Script) => {
    setRunning(false)
    setEditor(structuredClone(value))
  }
  const create = () =>
    edit({
      id: crypto.randomUUID(),
      title: "",
      presenter: "",
      updated: "",
      blocks: [
        {
          id: crypto.randomUUID(),
          title: "Abertura",
          type: "CABEÇA",
          text: "",
        },
      ],
    })
  const exportScript = () => {
    const text = `${script.title}\nApresentador: ${script.presenter}\n\n${script.blocks.map((b) => `[${b.type}] ${b.title}\n\n${b.text}`).join("\n\n---\n\n")}`
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    )
    const a = document.createElement("a")
    a.href = url
    a.download = `${script.title}.txt`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    notify("Roteiro exportado em TXT.")
  }
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await player.current?.requestFullscreen()
    } catch {
      notify("Tela cheia indisponível neste ambiente. Use o modo apresentador.")
    }
  }
  const reset = () => {
    setRunning(false)
    setElapsed(0)
    scrollPosition.current = 0
    if (viewport.current) viewport.current.scrollTop = 0
  }
  const teleprompter = (
    <section
      className={`prompter ${presenter ? "presenter-prompter" : ""}`}
      ref={player}
      aria-label="Teleprompter"
    >
      <div className="prompter-bar">
        <span>
          <span className={`dot ${running ? "lime" : "gray"}`} />
          {running ? "ROLAGEM EM CURSO" : "PRONTO PARA LEITURA"}
        </span>
        <span>
          {block.type} <i /> BLOCO {String(blockIndex + 1).padStart(2, "0")} /{" "}
          {String(script.blocks.length).padStart(2, "0")}
        </span>
        <button title="Tela cheia" className="bare" onClick={fullscreen}>
          <Icon name="fullscreen" size={16} />
        </button>
      </div>
      <div className="reading-window" onWheel={() => setRunning(false)}>
        <div className="reading-guide">
          <span />
        </div>
        <div
          className="script-scroll"
          ref={viewport}
          onScroll={(e) => {
            if (!running) scrollPosition.current = e.currentTarget.scrollTop
          }}
        >
          <div
            className={`reading-text ${mirrorX ? "mirror-x" : ""} ${
              mirrorY ? "mirror-y" : ""
            }`}
            style={{
              fontSize,
              transform: `scale(${mirrorX ? -1 : 1}, ${mirrorY ? -1 : 1})`,
            }}
          >
            <span className="script-cue">{block.title.toUpperCase()}</span>
            {block.text
              .split(/\n+/)
              .filter(Boolean)
              .map((paragraph, index) => (
                <p
                  key={`${block.id}-${index}`}
                  className={index === 1 ? "accent-line" : ""}
                >
                  {paragraph}
                </p>
              ))}
            <div className="end-cue">
              FIM DO BLOCO <span>◇</span>
            </div>
          </div>
        </div>
        <div className="reading-vignette" />
      </div>
      <div className="prompter-bottom">
        <span>
          <Icon name="lock" size={13} /> EDIÇÃO BLOQUEADA NA SAÍDA
        </span>
        <span>
          MANUAL <span className="dot lime" />
        </span>
      </div>
    </section>
  )

  return (
    <div className={`app-shell ${presenter ? "presenter-mode" : ""}`}>
      {presenter ? (
        <>
          <div className="presenter-top">
            <span>
              TP AUTOPILOT <span className="dim">/ SAÍDA DE APRESENTAÇÃO</span>
            </span>
            <button
              className="button"
              onClick={() => {
                setPresenter(false)
                setRunning(false)
              }}
            >
              <Icon name="arrow" size={15} /> Voltar ao operador <kbd>Esc</kbd>
            </button>
          </div>
          {teleprompter}
          <div className="presenter-help">
            <button
              className="button primary"
              onClick={() => setRunning((v) => !v)}
            >
              <Icon name={running ? "pause" : "play"} size={16} />
              {running ? "Pausar" : "Iniciar leitura"}
            </button>
            <span>Espaço: pausar · ↑ ↓: ajuste manual · ← →: trocar bloco</span>
          </div>
        </>
      ) : (
        <>
          <aside className="sidebar">
            <div className="brand">
              <div className="brand-mark">
                <i />
                <i />
                <i />
                <i />
              </div>
              <div>
                <strong>
                  autopilot<span>™</span>
                </strong>
                <small>TELEPROMPTER INTELLIGENCE</small>
              </div>
            </div>
            <div className="workspace">
              <div className="workspace-avatar">ST</div>
              <div>
                <strong>Estúdio de jornalismo</strong>
                <small>Workspace local</small>
              </div>
              <Icon name="chevron" size={15} />
            </div>
            <div className="nav-label">WORKSPACE</div>
            <nav aria-label="Navegação principal">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  className={page === item.id ? "active" : ""}
                  onClick={() => changePage(item.id)}
                  aria-current={page === item.id ? "page" : undefined}
                >
                  <Icon name={item.icon} size={19} />
                  <span>{item.label}</span>
                  {item.id === "scripts" && <small>{scripts.length}</small>}
                  {page === item.id && <span className="nav-active-dot" />}
                </button>
              ))}
            </nav>
            <div className="sidebar-note">
              <div className="sidebar-note-icon">
                <Icon name="shield" size={19} />
              </div>
              <strong>Controle sempre humano.</strong>
              <p>
                A automação auxilia.
                <br />O operador tem a última palavra.
              </p>
              <span>
                PROJETADO PARA O ESTÚDIO <Icon name="arrow" size={12} />
              </span>
            </div>
            <div className="sidebar-bottom">
              <div className="local-status">
                <span className="dot lime" />
                <span>
                  Armazenamento local
                  <small>
                    {saveError
                      ? "Indisponível · exporte seu roteiro"
                      : "Sem conta ou servidor externo"}
                  </small>
                </span>
              </div>
              <button
                onClick={() => {
                  setRunning(false)
                  setSettings(true)
                }}
              >
                <Icon name="settings" size={18} /> Preferências <span>⌘</span>
              </button>
              <div className="operator">
                <span>OP</span>
                <div>
                  <strong>Operador de TP</strong>
                  <small>Sessão local · demonstração</small>
                </div>
                <Icon name="chevron" size={15} />
              </div>
            </div>
          </aside>
          <main>
            <div className="topbar">
              <div>
                Workspace <span>/</span>{" "}
                <strong>{navigation.find((n) => n.id === page)?.label}</strong>
              </div>
              <div className="topbar-right">
                <span className="badge neutral">
                  <span className="dot gray" /> AMBIENTE LOCAL
                </span>
                <span className="divider" />
                <span className="version">v2.0</span>
                <div className="avatar">OP</div>
              </div>
            </div>
            <div className="content">
              <header className="page-header">
                <div>
                  <div className="eyebrow">
                    <span className="mini-line" /> BROADCAST WORKSPACE
                  </div>
                  <h1>
                    {page === "console"
                      ? "Sua voz. No ritmo certo."
                      : page === "scripts"
                        ? "Cada história, no seu lugar."
                        : page === "requirements"
                          ? "Do requisito à operação."
                          : "Preparado para o mundo real."}
                  </h1>
                  <p>
                    {page === "console"
                      ? "Prepare o roteiro, ajuste a leitura e mantenha o controle da operação."
                      : page === "scripts"
                        ? "Organize as edições e construa roteiros em blocos, com salvamento local."
                        : page === "requirements"
                          ? "Escopo transparente: o que funciona agora e o que ainda precisa ser construído."
                          : "Uma arquitetura local, com segurança por projeto e contingência verificável."}
                  </p>
                </div>
                <div className="header-actions">
                  {page === "console" ? (
                    <>
                      <button className="button" onClick={() => edit(script)}>
                        <Icon name="document" size={16} />
                        Editar roteiro
                      </button>
                      <button
                        className="button dark"
                        onClick={() => {
                          setRunning(false)
                          setPresenter(true)
                        }}
                      >
                        <Icon name="monitor" size={16} />
                        Modo apresentador <Icon name="arrow" size={14} />
                      </button>
                    </>
                  ) : page === "scripts" ? (
                    <button className="button dark" onClick={create}>
                      <Icon name="plus" size={17} />
                      Novo roteiro
                    </button>
                  ) : (
                    <button
                      className="button"
                      onClick={() => {
                        const text =
                          page === "requirements"
                            ? requirements
                                .map((r) => r.join(" | "))
                                .join("\n\n")
                            : architectureLayers
                                .map((r) => `${r[1]} ${r[2]}\n${r[3]}\n${r[4]}`)
                                .join("\n\n")
                        const url = URL.createObjectURL(
                          new Blob([text], {
                            type: "text/plain;charset=utf-8",
                          }),
                        )
                        const a = document.createElement("a")
                        a.href = url
                        a.download = `${page}.txt`
                        a.click()
                        setTimeout(() => URL.revokeObjectURL(url), 1000)
                        notify("Documento exportado.")
                      }}
                    >
                      <Icon name="document" size={16} />
                      Exportar documento
                    </button>
                  )}
                </div>
              </header>
              {page === "console" && (
                <>
                  <div className="summary-grid">
                    <article className="summary-card">
                      <span className="summary-icon">
                        <Icon name="document" />
                      </span>
                      <div>
                        <small>ROTEIRO CARREGADO</small>
                        <strong>{script.title}</strong>
                        <p>
                          {script.blocks.length} blocos <span>·</span> {words}{" "}
                          palavras
                        </p>
                      </div>
                      <span className="badge success">Local</span>
                    </article>
                    <article className="summary-card">
                      <span className="summary-icon">
                        <Icon name="speed" />
                      </span>
                      <div>
                        <small>MODO DE OPERAÇÃO</small>
                        <strong>Controle manual</strong>
                        <p>Teclado e wheel disponíveis</p>
                      </div>
                      <span className="tiny-tag">ATIVO</span>
                    </article>
                    <article className="summary-card">
                      <span className="summary-icon muted-icon">
                        <Icon name="mic" />
                      </span>
                      <div>
                        <small>VOICE TRACKING</small>
                        <strong className="muted-text">Não conectado</strong>
                        <p>Motor de IA local não instalado</p>
                      </div>
                      <span className="dot gray" />
                    </article>
                  </div>
                  <div className="console-grid">
                    <section className="rundown panel">
                      <div className="panel-header">
                        <div>
                          <h2>Espelho do programa</h2>
                          <p>Sequência de leitura</p>
                        </div>
                        <span className="count">
                          {String(script.blocks.length).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="script-selector">
                        <label htmlFor="script-selection">
                          EDIÇÃO SELECIONADA
                        </label>
                        <select
                          id="script-selection"
                          value={script.id}
                          onChange={(e) => chooseScript(e.target.value)}
                        >
                          {scripts.map((s) => (
                            <option value={s.id} key={s.id}>
                              {s.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="block-list">
                        {script.blocks.map((b, index) => (
                          <button
                            key={b.id}
                            className={`block-item ${
                              index === blockIndex ? "selected" : ""
                            }`}
                            onClick={() => selectBlock(index)}
                          >
                            <span className="block-number">
                              {index === blockIndex ? (
                                <Icon name="play" size={12} />
                              ) : (
                                String(index + 1).padStart(2, "0")
                              )}
                            </span>
                            <div>
                              <strong>{b.title}</strong>
                              <span>
                                {b.type} <i />{" "}
                                {timeLabel(
                                  Math.max(5, b.text.split(/\s+/).length / 2.5),
                                )}
                              </span>
                            </div>
                            {index === blockIndex && (
                              <span className="block-active" />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="rundown-footer">
                        <Icon name="lock" size={14} />
                        <span>Roteiro salvo neste navegador</span>
                      </div>
                    </section>
                    <div className="center-console">
                      <div className="preview-heading">
                        <h2>
                          Monitor de leitura <span>PRÉVIA DO APRESENTADOR</span>
                        </h2>
                        <span className="badge neutral">
                          <span className="dot gray" />
                          {running ? "EM LEITURA" : "EM ESPERA"}
                        </span>
                      </div>
                      {teleprompter}
                      <div className="transport panel">
                        <div className="transport-main">
                          <div className="transport-buttons">
                            <button
                              title="Voltar ao início do bloco"
                              className="button icon-button"
                              onClick={reset}
                            >
                              <span className="reset-symbol">↺</span>
                            </button>
                            <button
                              className="button primary play-control"
                              onClick={() => setRunning((v) => !v)}
                            >
                              <Icon
                                name={running ? "pause" : "play"}
                                size={17}
                              />
                              {running ? "Pausar" : "Iniciar leitura"}
                              <kbd>Space</kbd>
                            </button>
                          </div>
                          <span className="timer">
                            {timeLabel(elapsed)}
                            <small> TEMPO DE LEITURA</small>
                          </span>
                        </div>
                        <div className="transport-settings">
                          <div className="speed-slider">
                            <label htmlFor="scroll-speed">
                              Velocidade{" "}
                              <strong>
                                {speed}
                                <small> px/s</small>
                              </strong>
                            </label>
                            <input
                              id="scroll-speed"
                              type="range"
                              min="10"
                              max="90"
                              value={speed}
                              onChange={(e) => setSpeed(Number(e.target.value))}
                            />
                          </div>
                          <div className="transport-separator" />
                          <div className="font-buttons">
                            <span>Texto</span>
                            <button
                              aria-label="Diminuir texto"
                              disabled={fontSize <= 24}
                              onClick={() =>
                                setFontSize((v) => Math.max(24, v - 2))
                              }
                            >
                              A−
                            </button>
                            <button
                              aria-label="Aumentar texto"
                              disabled={fontSize >= 52}
                              onClick={() =>
                                setFontSize((v) => Math.min(52, v + 2))
                              }
                            >
                              A+
                            </button>
                          </div>
                          <div className="transport-separator" />
                          <button
                            title="Espelhar horizontalmente"
                            aria-pressed={mirrorX}
                            className={`small-control ${
                              mirrorX ? "is-active" : ""
                            }`}
                            onClick={() => setMirrorX((v) => !v)}
                          >
                            <Icon name="mirror" size={16} />H
                          </button>
                          <button
                            title="Espelhar verticalmente"
                            aria-pressed={mirrorY}
                            className={`small-control ${
                              mirrorY ? "is-active" : ""
                            }`}
                            onClick={() => setMirrorY((v) => !v)}
                          >
                            <span className="vertical-mirror">
                              <Icon name="mirror" size={16} />
                            </span>
                            V
                          </button>
                        </div>
                      </div>
                      <div className="keyboard-hint">
                        <span>
                          <kbd>Space</kbd> iniciar / pausar
                        </span>
                        <span>
                          <kbd>↑</kbd>
                          <kbd>↓</kbd> ajuste manual
                        </span>
                        <span>
                          <kbd>←</kbd>
                          <kbd>→</kbd> trocar bloco
                        </span>
                      </div>
                    </div>
                    <aside className="operation-rail">
                      <section className="panel tracking-panel">
                        <div className="panel-header">
                          <h2>
                            <Icon name="activity" size={17} />
                            Voice tracking
                          </h2>
                          <span className="planned-label">OFFLINE AI</span>
                        </div>
                        <div className="tracking-visual">
                          <div className="orbit orbit-one" />
                          <div className="orbit orbit-two" />
                          <div className="mic-center">
                            <Icon name="mic" size={24} />
                          </div>
                        </div>
                        <h3>Pronto para o próximo passo.</h3>
                        <p>
                          A leitura já está sob seu controle. O acompanhamento
                          por voz requer um motor de IA local.
                        </p>
                        <div className="tracking-stats">
                          <div>
                            <span>Motor STT</span>
                            <strong>Não conectado</strong>
                          </div>
                          <div>
                            <span>Confiança</span>
                            <strong>—</strong>
                          </div>
                          <div>
                            <span>Latência</span>
                            <strong>Não medida</strong>
                          </div>
                        </div>
                        <button
                          className="button full-width"
                          onClick={() => changePage("architecture")}
                        >
                          Conhecer a arquitetura <Icon name="arrow" size={14} />
                        </button>
                      </section>
                      <section className="manual-note">
                        <span className="note-icon">
                          <Icon name="shield" size={18} />
                        </span>
                        <div>
                          <strong>Você tem a prioridade.</strong>
                          <p>
                            Ao usar as setas ou a wheel, a rolagem automática
                            pausa. A retomada é sempre sua.
                          </p>
                        </div>
                      </section>
                    </aside>
                  </div>
                  <section className="preflight panel">
                    <div className="preflight-title">
                      <span className="summary-icon">
                        <Icon name="requirements" size={20} />
                      </span>
                      <div>
                        <h2>Antes de começar</h2>
                        <p>Checklist de preparação · confirmação manual</p>
                      </div>
                      <span className="check-progress">
                        {checks.filter(Boolean).length}/4
                      </span>
                    </div>
                    <div className="preflight-items">
                      {[
                        "Roteiro revisado",
                        "Espelhamento conferido",
                        "Leitura testada",
                        "Contingência preparada",
                      ].map((label, index) => (
                        <label
                          key={label}
                          className={checks[index] ? "checked" : ""}
                        >
                          <input
                            type="checkbox"
                            checked={checks[index]}
                            onChange={() =>
                              setChecks((v) =>
                                v.map((c, i) => (i === index ? !c : c)),
                              )
                            }
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </section>
                  <div className="honesty-note">
                    <Icon name="architecture" size={15} />
                    <p>
                      <strong>Protótipo funcional.</strong> Rolagem, edição e
                      espelhamento disponíveis. STT local, pedal físico,
                      redundância e saídas independentes ainda não
                      implementados.
                    </p>
                    <span>TRANSPARÊNCIA POR PROJETO</span>
                  </div>
                </>
              )}
              {page === "scripts" && (
                <>
                  <div className="list-toolbar">
                    <div className="tab-pill">
                      Todos os roteiros <span>{scripts.length}</span>
                    </div>
                    <input
                      className="search-input"
                      type="search"
                      aria-label="Buscar roteiros"
                      placeholder="Buscar por nome ou apresentador..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <div className="script-cards">
                    {scripts
                      .filter((s) =>
                        `${s.title} ${s.presenter}`
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                      )
                      .map((s) => (
                        <article className="script-card panel" key={s.id}>
                          <div className="script-card-top">
                            <span className="summary-icon">
                              <Icon name="document" size={23} />
                            </span>
                            <span
                              className={`badge ${
                                s.id === script.id ? "success" : "neutral"
                              }`}
                            >
                              {s.id === script.id ? "Carregado" : "Local"}
                            </span>
                          </div>
                          <h2>{s.title}</h2>
                          <p>{s.presenter || "Apresentador não definido"}</p>
                          <div className="script-card-meta">
                            <span>{s.blocks.length} blocos</span>
                            <span>{s.updated}</span>
                          </div>
                          <div className="script-card-actions">
                            <button
                              className="button dark"
                              onClick={() => {
                                chooseScript(s.id)
                                changePage("console")
                              }}
                            >
                              Abrir no console
                              <Icon name="arrow" size={14} />
                            </button>
                            <button className="button" onClick={() => edit(s)}>
                              Editar
                            </button>
                            <button
                              title="Duplicar roteiro"
                              className="button icon-button"
                              onClick={() => {
                                const copy = structuredClone(s)
                                copy.id = crypto.randomUUID()
                                copy.title += " · Cópia"
                                copy.updated = "Duplicado agora"
                                setScripts((v) => [...v, copy])
                                notify("Cópia criada.")
                              }}
                            >
                              <Icon name="layers" size={16} />
                            </button>
                            <button
                              title="Excluir roteiro"
                              className="delete-button"
                              disabled={scripts.length === 1}
                              onClick={() => setDeleteId(s.id)}
                            >
                              Excluir
                            </button>
                          </div>
                        </article>
                      ))}
                  </div>
                  {!scripts.some((s) =>
                    `${s.title} ${s.presenter}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  ) && (
                    <div className="empty-state">
                      <Icon name="document" size={32} />
                      <h2>Nenhum roteiro encontrado</h2>
                      <p>Tente outro nome ou crie uma nova edição.</p>
                    </div>
                  )}
                  <div className="storage-note">
                    <Icon name="lock" size={17} />
                    <span>
                      Os roteiros ficam neste navegador. Exporte uma cópia para
                      backup; limpar os dados do navegador remove o conteúdo
                      salvo.
                    </span>
                    <button className="text-button" onClick={exportScript}>
                      Exportar roteiro carregado <Icon name="arrow" size={13} />
                    </button>
                  </div>
                </>
              )}
              {page === "requirements" && (
                <>
                  <div className="document-banner">
                    <span className="summary-icon">
                      <Icon name="requirements" size={23} />
                    </span>
                    <div>
                      <h2>Uma especificação, sem falsas garantias.</h2>
                      <p>
                        “Disponível” descreve esta aplicação. “Parcial” e
                        “Planejado” identificam as lacunas até uma solução
                        industrial.
                      </p>
                    </div>
                    <span className="badge neutral">RF01–RF10</span>
                  </div>
                  <section className="panel requirements-panel">
                    <div className="requirements-head">
                      <span>REQUISITO</span>
                      <span>COMPORTAMENTO ESPERADO</span>
                      <span>ESTADO ATUAL</span>
                    </div>
                    {requirements.map(([id, title, spec, status, detail]) => (
                      <article className="requirement-row" key={id}>
                        <div>
                          <span className="rf-id">{id}</span>
                          <h3>{title}</h3>
                        </div>
                        <p>{spec}</p>
                        <div>
                          <span
                            className={`badge ${
                              status === "Disponível"
                                ? "success"
                                : status === "Parcial"
                                  ? "warning"
                                  : "neutral"
                            }`}
                          >
                            {status}
                          </span>
                          <p>{detail}</p>
                        </div>
                      </article>
                    ))}
                  </section>
                </>
              )}
              {page === "architecture" && (
                <>
                  <div className="document-tabs">
                    <button
                      className={activeDoc === "pipeline" ? "selected" : ""}
                      onClick={() => setActiveDoc("pipeline")}
                    >
                      Arquitetura local
                    </button>
                    <button
                      className={activeDoc === "contingency" ? "selected" : ""}
                      onClick={() => setActiveDoc("contingency")}
                    >
                      Contingência & validação
                    </button>
                    <button
                      className={activeDoc === "ergonomics" ? "selected" : ""}
                      onClick={() => setActiveDoc("ergonomics")}
                    >
                      Operação & ergonomia
                    </button>
                  </div>
                  {activeDoc === "pipeline" ? (
                    <>
                      <div className="architecture-intro">
                        <div>
                          <span className="eyebrow">ARQUITETURA PROPOSTA</span>
                          <h2>
                            Local por princípio.
                            <br />
                            Previsível por engenharia.
                          </h2>
                          <p>
                            A IA estima a posição. Um controlador determinístico
                            decide o movimento. O operador mantém a autoridade.
                          </p>
                        </div>
                        <div className="architecture-callout">
                          <Icon name="lock" size={22} />
                          <strong>Sem dependência de WAN</strong>
                          <p>
                            Modelos, fontes, licenças e assets precisam estar
                            disponíveis localmente. Validar também a
                            inicialização sem internet.
                          </p>
                        </div>
                      </div>
                      <div className="pipeline">
                        {architectureLayers.map(
                          ([icon, number, title, description, status]) => (
                            <article
                              className="panel pipeline-step"
                              key={number}
                            >
                              <span className="pipeline-number">{number}</span>
                              <span className="summary-icon">
                                <Icon name={icon} size={20} />
                              </span>
                              <div>
                                <h3>{title}</h3>
                                <p>{description}</p>
                              </div>
                              <span className="badge neutral">{status}</span>
                            </article>
                          ),
                        )}
                      </div>
                    </>
                  ) : activeDoc === "contingency" ? (
                    <>
                      <div className="document-banner">
                        <Icon name="shield" size={29} />
                        <div>
                          <h2>Continuidade não é uma promessa. É um ensaio.</h2>
                          <p>
                            “Zero erro” é uma intenção operacional. Homologação
                            exige medir falhas, recuperação e riscos residuais.
                          </p>
                        </div>
                      </div>
                      <div className="contingency-grid">
                        {[
                          [
                            "01",
                            "Falha de áudio ou IA",
                            "Descartar hipóteses vencidas, reter movimento e disponibilizar manual. Não continuar indefinidamente por inércia.",
                          ],
                          [
                            "02",
                            "Falha do editor",
                            "Renderizador e entrada manual em processos independentes. O texto publicado deve permanecer disponível.",
                          ],
                          [
                            "03",
                            "Falha da estação",
                            "Estação B com roteiro e âncora carregados. Comutação física de vídeo e controle, com tempo de troca medido.",
                          ],
                          [
                            "04",
                            "Falha de infraestrutura",
                            "UPS dimensionada, áudio e cabos alternativos, dispositivos reserva e procedimento treinado com a direção.",
                          ],
                        ].map(([n, title, text]) => (
                          <article className="panel contingency-card" key={n}>
                            <span className="pipeline-number">{n}</span>
                            <h3>{title}</h3>
                            <p>{text}</p>
                            <span className="planned-label">
                              A HOMOLOGAR EM ESTÚDIO
                            </span>
                          </article>
                        ))}
                      </div>
                      <section className="panel acceptance">
                        <h2>Critérios de aceite propostos</h2>
                        <p>
                          Metas iniciais para medição — não resultados
                          demonstrados.
                        </p>
                        {[
                          ["Comando manual → imagem", "p99 ≤ 100 ms"],
                          ["Áudio → posição útil", "p95 ≤ 500 ms"],
                          [
                            "Operação sem WAN",
                            "Inicialização + turno completo",
                          ],
                          [
                            "Falhas induzidas",
                            "Áudio, processo, GPU, rede e estação",
                          ],
                          [
                            "Saltos indevidos",
                            "Nenhum observado no corpus de aceite",
                          ],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <span>{label}</span>
                            <strong>{value}</strong>
                          </div>
                        ))}
                      </section>
                    </>
                  ) : (
                    <>
                      <div className="document-banner">
                        <Icon name="workflow" size={29} />
                        <div>
                          <h2>
                            Menos esforço contínuo. Mais consciência
                            situacional.
                          </h2>
                          <p>
                            O operador não sai da cadeia de segurança:
                            supervisiona, intervém e decide quando reativar a
                            IA.
                          </p>
                        </div>
                      </div>
                      <section className="panel comparison">
                        <div className="comparison-row comparison-head">
                          <strong>DIMENSÃO</strong>
                          <span>ANTES</span>
                          <span>DEPOIS · OPERAÇÃO PROPOSTA</span>
                        </div>
                        {[
                          [
                            "Postura",
                            "Controle contínuo, alcance e movimentos repetitivos.",
                            "Posto sentado, monitor regulável e wheel com apoio de antebraço.",
                          ],
                          [
                            "Ritmo",
                            "Apresentador adapta a fala à rolagem.",
                            "Automação acompanha variações dentro dos limites homologados.",
                          ],
                          [
                            "Improviso",
                            "Operador precisa encontrar o ponto de retomada.",
                            "Estado de desvio explícito, âncora preservada e reentrada conservadora.",
                          ],
                          [
                            "Autoridade",
                            "Controle de velocidade permanente.",
                            "Manual prioritário; IA só retoma após confirmação.",
                          ],
                          [
                            "Alertas",
                            "Estados dependentes apenas de cor.",
                            "Texto, ícone e motivo da degradação; informação sem ambiguidade.",
                          ],
                          [
                            "Contingência",
                            "Troca improvisada no incidente.",
                            "Equipamento reserva preparado e procedimentos ensaiados.",
                          ],
                        ].map(([topic, before, after]) => (
                          <div className="comparison-row" key={topic}>
                            <strong>{topic}</strong>
                            <p>{before}</p>
                            <p>{after}</p>
                          </div>
                        ))}
                      </section>
                    </>
                  )}
                </>
              )}
              <footer>
                <span>
                  <span className="footer-mark">autopilot</span> Feito para
                  acompanhar. Não para interromper.
                </span>
                <span>
                  LOCAL FIRST <i /> HUMAN IN CONTROL
                </span>
              </footer>
            </div>
          </main>
        </>
      )}
      {toast && (
        <div role="status" className="toast">
          <Icon name="check" size={17} />
          {toast}
          <button aria-label="Fechar notificação" onClick={() => setToast("")}>
            ×
          </button>
        </div>
      )}
      {saveError && (
        <div className="save-warning" role="alert">
          Não foi possível salvar localmente. Exporte o roteiro antes de fechar.
        </div>
      )}
      {editor && (
        <div className="modal-backdrop">
          <section
            className="modal editor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-title"
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">REDAÇÃO LOCAL</span>
                <h2 id="editor-title">
                  {scripts.some((s) => s.id === editor.id)
                    ? "Editar roteiro"
                    : "Novo roteiro"}
                </h2>
              </div>
              <button
                className="close-button"
                aria-label="Fechar editor"
                onClick={() => setEditor(null)}
              >
                ×
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const saved = {
                  ...editor,
                  title: editor.title.trim(),
                  updated:
                    "Editado em " + new Date().toLocaleDateString("pt-BR"),
                }
                if (
                  !saved.title ||
                  saved.blocks.some((b) => !b.title.trim() || !b.text.trim())
                )
                  return
                setScripts((v) =>
                  v.some((s) => s.id === saved.id)
                    ? v.map((s) => (s.id === saved.id ? saved : s))
                    : [...v, saved],
                )
                chooseScript(saved.id)
                reset()
                setEditor(null)
                notify("Roteiro salvo. A leitura permanece pausada.")
              }}
            >
              <div className="editor-body">
                <div className="form-grid">
                  <label>
                    Nome da edição
                    <input
                      required
                      maxLength={90}
                      value={editor.title}
                      placeholder="Ex.: Jornal da Noite"
                      onChange={(e) =>
                        setEditor({ ...editor, title: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Apresentador
                    <input
                      maxLength={90}
                      value={editor.presenter}
                      placeholder="Nome do apresentador"
                      onChange={(e) =>
                        setEditor({ ...editor, presenter: e.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="editor-block-title">
                  <h3>Blocos do roteiro</h3>
                  <span>{editor.blocks.length} blocos</span>
                </div>
                {editor.blocks.map((b, index) => (
                  <div className="editor-block" key={b.id}>
                    <div className="editor-block-heading">
                      <span className="rf-id">
                        BLOCO {String(index + 1).padStart(2, "0")}
                      </span>
                      {editor.blocks.length > 1 && (
                        <button
                          type="button"
                          className="delete-button"
                          onClick={() =>
                            setEditor({
                              ...editor,
                              blocks: editor.blocks.filter(
                                (v) => v.id !== b.id,
                              ),
                            })
                          }
                        >
                          Remover bloco
                        </button>
                      )}
                    </div>
                    <div className="form-grid">
                      <label>
                        Título
                        <input
                          required
                          value={b.title}
                          onChange={(e) =>
                            setEditor({
                              ...editor,
                              blocks: editor.blocks.map((v) =>
                                v.id === b.id
                                  ? { ...v, title: e.target.value }
                                  : v,
                              ),
                            })
                          }
                        />
                      </label>
                      <label>
                        Tipo
                        <select
                          value={b.type}
                          onChange={(e) =>
                            setEditor({
                              ...editor,
                              blocks: editor.blocks.map((v) =>
                                v.id === b.id
                                  ? { ...v, type: e.target.value }
                                  : v,
                              ),
                            })
                          }
                        >
                          {[
                            "CABEÇA",
                            "LINK AO VIVO",
                            "SERVIÇO",
                            "NOTA",
                            "PLANTÃO",
                            "OFF",
                          ].map((type) => (
                            <option key={type}>{type}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      Texto para leitura
                      <textarea
                        required
                        rows={6}
                        value={b.text}
                        placeholder="Escreva o texto. Separe os parágrafos com uma linha em branco."
                        onChange={(e) =>
                          setEditor({
                            ...editor,
                            blocks: editor.blocks.map((v) =>
                              v.id === b.id
                                ? { ...v, text: e.target.value }
                                : v,
                            ),
                          })
                        }
                      />
                    </label>
                  </div>
                ))}
                <button
                  type="button"
                  className="button full-width add-block"
                  onClick={() =>
                    setEditor({
                      ...editor,
                      blocks: [
                        ...editor.blocks,
                        {
                          id: crypto.randomUUID(),
                          title: `Bloco ${editor.blocks.length + 1}`,
                          type: "CABEÇA",
                          text: "",
                        },
                      ],
                    })
                  }
                >
                  <Icon name="plus" size={16} />
                  Adicionar bloco
                </button>
              </div>
              <div className="modal-footer">
                <span>
                  <Icon name="lock" size={13} /> Salvamento neste navegador
                </span>
                <button
                  type="button"
                  className="button"
                  onClick={() => setEditor(null)}
                >
                  Cancelar
                </button>
                <button className="button dark" type="submit">
                  Salvar roteiro
                  <Icon name="check" size={16} />
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {settings && (
        <div className="modal-backdrop">
          <section
            className="modal settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
          >
            <div className="modal-header">
              <h2 id="settings-title">Preferências de leitura</h2>
              <button
                className="close-button"
                aria-label="Fechar preferências"
                onClick={() => setSettings(false)}
              >
                ×
              </button>
            </div>
            <div className="settings-body">
              <label>
                Tamanho do texto <strong>{fontSize}px</strong>
                <input
                  type="range"
                  min="24"
                  max="52"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                />
              </label>
              <label>
                Velocidade de rolagem <strong>{speed}px/s</strong>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={mirrorX}
                  onChange={(e) => setMirrorX(e.target.checked)}
                />
                Espelhamento horizontal
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={mirrorY}
                  onChange={(e) => setMirrorY(e.target.checked)}
                />
                Espelhamento vertical
              </label>
              <p className="settings-caption">
                Ajustes aplicados à sessão atual. Confira a orientação no vidro
                antes de iniciar a leitura.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="button"
                onClick={() => {
                  setFontSize(32)
                  setSpeed(32)
                  setMirrorX(false)
                  setMirrorY(false)
                }}
              >
                Restaurar padrão
              </button>
              <button
                className="button dark"
                onClick={() => setSettings(false)}
              >
                Concluir
              </button>
            </div>
          </section>
        </div>
      )}
      {deleteId && (
        <div className="modal-backdrop">
          <section
            className="modal settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <div className="modal-header">
              <h2 id="delete-title">Excluir este roteiro?</h2>
              <button
                className="close-button"
                aria-label="Cancelar exclusão"
                onClick={() => setDeleteId(null)}
              >
                ×
              </button>
            </div>
            <div className="settings-body">
              <p>
                “{scripts.find((s) => s.id === deleteId)?.title}” será removido
                deste navegador. Essa ação não pode ser desfeita.
              </p>
            </div>
            <div className="modal-footer">
              <button className="button" onClick={() => setDeleteId(null)}>
                Cancelar
              </button>
              <button
                className="button danger"
                onClick={() => {
                  const next = scripts.filter((s) => s.id !== deleteId)
                  if (scriptId === deleteId) chooseScript(next[0].id)
                  setScripts(next)
                  setDeleteId(null)
                  notify("Roteiro excluído.")
                }}
              >
                Excluir roteiro
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
