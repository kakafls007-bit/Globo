export type Tone = "urgente" | "policial" | "serio" | "leve" | "serie" | "servico"

export type Block = {
  id: string
  title: string
  /** Formato do bloco: CABEÇA, LINK AO VIVO, NOTA... */
  type: string
  /** Tom emocional da matéria. Avisa o apresentador antes da leitura. */
  tone: Tone
  /** Instrução curta de interpretação. Se vazia, usa a dica padrão do tom. */
  toneHint?: string
  text: string
}
export type Script = {
  id: string
  title: string
  presenter: string
  updated: string
  blocks: Block[]
}

/**
 * Catálogo de tons. Cada tom combina cor + ícone + palavra (nunca só cor),
 * para funcionar em alto contraste e para quem tem daltonismo.
 * `weight` é o "peso emocional" (1 a 5): o alerta de mudança de tom só
 * dispara quando a diferença entre dois blocos seguidos é >= 2.
 */
export const TONES: Record<
  Tone,
  { label: string; icon: string; color: string; weight: number; hint: string }
> = {
  urgente: {
    label: "URGENTE",
    icon: "▲",
    color: "#ff5a4f",
    weight: 5,
    hint: "Ritmo firme, tom grave, sem sorriso",
  },
  policial: {
    label: "POLICIAL",
    icon: "■",
    color: "#ff9a3c",
    weight: 4,
    hint: "Neutro e objetivo, sem adjetivos",
  },
  serio: {
    label: "SÉRIO",
    icon: "◆",
    color: "#5aa9ff",
    weight: 3,
    hint: "Tom institucional, ritmo constante",
  },
  servico: {
    label: "SERVIÇO",
    icon: "○",
    color: "#b4bdb6",
    weight: 2,
    hint: "Claro e didático",
  },
  serie: {
    label: "SÉRIE",
    icon: "◐",
    color: "#b58cff",
    weight: 2,
    hint: "Chamada de reportagem especial, tom de convite",
  },
  leve: {
    label: "LEVE",
    icon: "●",
    color: "#6fd98a",
    weight: 1,
    hint: "Sorriso permitido, ritmo leve",
  },
}

export const toneOrder = Object.keys(TONES) as Tone[]

export const initialScripts: Script[] = [
  {
    id: "jornal-noite",
    title: "Jornal da Noite",
    presenter: "Marina Costa",
    updated: "Roteiro de demonstração",
    blocks: [
      {
        id: "abertura",
        title: "Abertura do jornal",
        type: "CABEÇA",
        tone: "serio",
        text: "Boa noite. Informação com contexto, compromisso com você.\n\nComeçamos esta edição com as principais notícias do dia.\n\nO novo sistema de mobilidade entra em operação nesta segunda-feira, com reforço nos horários de maior movimento em toda a região metropolitana.\n\nA mudança deve beneficiar mais de dois milhões de passageiros por dia. As novas linhas conectam bairros que antes dependiam de até três integrações.\n\nAo vivo, nossa repórter acompanha os primeiros testes. Vamos saber como fica a rotina de quem utiliza o transporte público.",
      },
      {
        id: "mobilidade",
        title: "Mobilidade urbana",
        type: "LINK AO VIVO",
        tone: "serio",
        text: "Vamos agora ao centro da cidade, onde os primeiros veículos já começaram a circular.\n\nComo está a movimentação por aí? Os passageiros já estão se adaptando às novas linhas?\n\nA prefeitura informou que equipes de orientação estarão nas principais estações durante toda a semana.\n\nObrigado pelas informações. A gente continua acompanhando.",
      },
      {
        id: "economia",
        title: "Economia e mercados",
        type: "CABEÇA",
        tone: "serio",
        text: "Na economia, o dia foi de atenção aos novos indicadores.\n\nO comércio registrou crescimento no último trimestre. Os dados mostram uma recuperação gradual, com destaque para os pequenos negócios.\n\nEspecialistas recomendam cautela no planejamento das despesas e atenção às taxas de juros.\n\nA reportagem mostra o que muda para o consumidor.",
      },
      {
        id: "tempo",
        title: "Previsão do tempo",
        type: "SERVIÇO",
        tone: "servico",
        text: "E como fica o tempo amanhã?\n\nA previsão indica uma manhã de céu aberto, com aumento de nuvens ao longo da tarde.\n\nHá possibilidade de chuva isolada na região metropolitana. A temperatura mínima será de dezoito graus, e a máxima chega aos vinte e sete.\n\nConfira agora a previsão completa para a sua região.",
      },
      {
        id: "esporte",
        title: "Esporte",
        type: "CABEÇA",
        tone: "leve",
        text: "No esporte, a preparação para a próxima rodada já começou.\n\nO time voltou aos treinos nesta manhã, com foco na recuperação dos atletas e nos ajustes táticos.\n\nA expectativa é de estádio cheio no fim de semana. Os ingressos estarão disponíveis a partir de amanhã.",
      },
      {
        id: "acidente",
        title: "Acidente na BR-101",
        type: "PLANTÃO",
        tone: "urgente",
        toneHint: "Tom grave, sem sorriso, voz firme",
        text: "Informação de última hora. Um acidente envolvendo três veículos interdita a BR-101, no sentido litoral, desde o início da noite.\n\nAs equipes de resgate já estão no local e a circulação segue com bloqueio parcial.\n\nA orientação é evitar o trecho e procurar rotas alternativas. Voltaremos com novas informações assim que houver confirmação das autoridades.",
      },
      {
        id: "encerramento",
        title: "Encerramento",
        type: "NOTA",
        tone: "serio",
        text: "Estas foram as principais notícias desta edição.\n\nVocê encontra mais informações e as reportagens completas nos nossos canais.\n\nObrigado pela companhia. Uma boa noite e até amanhã.",
      },
    ],
  },
  {
    id: "plantao",
    title: "Plantão de Notícias",
    presenter: "Equipe de jornalismo",
    updated: "Roteiro de demonstração",
    blocks: [
      {
        id: "plantao-abertura",
        title: "Informação de última hora",
        type: "PLANTÃO",
        tone: "urgente",
        text: "Interrompemos a nossa programação para uma informação importante.\n\nNossa equipe está acompanhando os acontecimentos. As informações confirmadas serão atualizadas nesta edição.\n\nVoltaremos com novos detalhes assim que houver confirmação.",
      },
    ],
  },
]

export const requirements = [
  [
    "RF01",
    "Gestão de roteiros e blocos",
    "Criar, editar, duplicar e excluir roteiros com blocos identificáveis.",
    "Parcial",
    "CRUD e persistência no navegador disponíveis; versionamento editorial pendente.",
  ],
  [
    "RF02",
    "Metadados editoriais",
    "Título, formato, tom emocional e dica de interpretação por bloco.",
    "Disponível",
    "Tom e dica editáveis por bloco; a duração é estimada pelo tamanho do texto.",
  ],
  [
    "RF03",
    "Alertas de transição",
    "Barra “A seguir” com título e tom da próxima matéria, com pré-aviso quando o tom muda de forma relevante.",
    "Parcial",
    "Disparo pela posição de rolagem e velocidade; com voice tracking passará a usar a posição da fala.",
  ],
  [
    "RF04",
    "Exibição protegida",
    "Saída limpa, tela cheia e separação da edição.",
    "Parcial",
    "Modo apresentador e tela cheia disponíveis; isolamento de processos pendente.",
  ],
  [
    "RF05",
    "Telas independentes",
    "Console do operador e saída dedicada ao apresentador.",
    "Planejado",
    "Modos separados na mesma aplicação; saída física independente não implementada.",
  ],
  [
    "RF06",
    "Espelhamento por saída",
    "Inversão horizontal, vertical ou combinada sem alterar o texto.",
    "Disponível",
    "Transformações aplicadas apenas ao texto de apresentação.",
  ],
  [
    "RF07",
    "Zoom e ajustes ao vivo",
    "Aumentar e diminuir fonte e espaçamento em tempo real, sem pausar a rolagem.",
    "Disponível",
    "A posição de leitura é preservada ao reajustar o texto; atalhos + e − para a fonte.",
  ],
  [
    "RF08",
    "Alto contraste",
    "Fundo preto com texto branco ou amarelo; tons identificados por ícone e palavra.",
    "Disponível",
    "Modos Normal, Branco e Amarelo; atalho C alterna o modo.",
  ],
  [
    "RF09",
    "Marcador visual",
    "Linha de guia contínua para orientar o olhar, com posição ajustável.",
    "Disponível",
    "Linha com setas laterais; posição e visibilidade ajustáveis; atalho G liga e desliga.",
  ],
  [
    "RF10",
    "Voice tracking offline",
    "Reconhecer e alinhar a fala localmente ao roteiro ativo, sem internet.",
    "Planejado",
    "Nenhum modelo STT está conectado a esta versão.",
  ],
  [
    "RF11",
    "Autoridade manual",
    "Intervenção prioritária por teclado, wheel e periféricos sobre a automação.",
    "Parcial",
    "Espaço, setas e wheel disponíveis; jog dial e pedal físicos não integrados.",
  ],
  [
    "RF12",
    "Confiança da IA",
    "Indicador de confiança do alinhamento no console do operador.",
    "Planejado",
    "Painel reservado; depende do motor de voice tracking.",
  ],
  [
    "RF13",
    "Continuidade e reserva",
    "Saída preservada, réplica de estado e comutação homologada.",
    "Planejado",
    "Exige processos e equipamentos independentes; não simulada como ativa.",
  ],
  [
    "RF14",
    "Publicação e auditoria",
    "Revisões imutáveis, atualização segura e registro de eventos.",
    "Planejado",
    "Persistência local não substitui controle de versão ou trilha de auditoria.",
  ],
]

export const architectureLayers = [
  [
    "mic",
    "01",
    "Captura de áudio",
    "Canal dedicado do apresentador, timestamps monotônicos e monitoramento de sinal. Distinguir silêncio de desconexão.",
    "A implementar",
  ],
  [
    "activity",
    "02",
    "STT incremental local",
    "Avaliar sherpa-onnx com modelo PT-BR, Vosk e whisper.cpp. Escolher pelo erro de acompanhamento e latência medida, não apenas WER.",
    "A homologar",
  ],
  [
    "layers",
    "03",
    "Alinhamento contextual",
    "Busca local, tolerância a omissões e repetições, âncoras por bloco e rejeição de hipóteses vencidas. Saltos distantes exigem confirmação.",
    "A implementar",
  ],
  [
    "speed",
    "04",
    "Controlador de movimento",
    "IA propõe posição; controlador limita velocidade e aceleração. Comando manual tem prioridade e a IA não reassume sozinha.",
    "Rolagem manual disponível",
  ],
  [
    "monitor",
    "05",
    "Saída e contingência",
    "Renderizador isolado, estação reserva, cópia local e comutação física de vídeo. Validar tempo real de retomada e falhas comuns.",
    "Infraestrutura necessária",
  ],
] as const
