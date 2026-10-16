export type Block = {
  id: string
  title: string
  type: string
  text: string
}
export type Script = {
  id: string
  title: string
  presenter: string
  updated: string
  blocks: Block[]
}

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
        text: "Boa noite. Informação com contexto, compromisso com você.\n\nComeçamos esta edição com as principais notícias do dia.\n\nO novo sistema de mobilidade entra em operação nesta segunda-feira, com reforço nos horários de maior movimento em toda a região metropolitana.\n\nA mudança deve beneficiar mais de dois milhões de passageiros por dia. As novas linhas conectam bairros que antes dependiam de até três integrações.\n\nAo vivo, nossa repórter acompanha os primeiros testes. Vamos saber como fica a rotina de quem utiliza o transporte público.",
      },
      {
        id: "mobilidade",
        title: "Mobilidade urbana",
        type: "LINK AO VIVO",
        text: "Vamos agora ao centro da cidade, onde os primeiros veículos já começaram a circular.\n\nComo está a movimentação por aí? Os passageiros já estão se adaptando às novas linhas?\n\nA prefeitura informou que equipes de orientação estarão nas principais estações durante toda a semana.\n\nObrigado pelas informações. A gente continua acompanhando.",
      },
      {
        id: "economia",
        title: "Economia e mercados",
        type: "CABEÇA",
        text: "Na economia, o dia foi de atenção aos novos indicadores.\n\nO comércio registrou crescimento no último trimestre. Os dados mostram uma recuperação gradual, com destaque para os pequenos negócios.\n\nEspecialistas recomendam cautela no planejamento das despesas e atenção às taxas de juros.\n\nA reportagem mostra o que muda para o consumidor.",
      },
      {
        id: "tempo",
        title: "Previsão do tempo",
        type: "SERVIÇO",
        text: "E como fica o tempo amanhã?\n\nA previsão indica uma manhã de céu aberto, com aumento de nuvens ao longo da tarde.\n\nHá possibilidade de chuva isolada na região metropolitana. A temperatura mínima será de dezoito graus, e a máxima chega aos vinte e sete.\n\nConfira agora a previsão completa para a sua região.",
      },
      {
        id: "esporte",
        title: "Esporte",
        type: "CABEÇA",
        text: "No esporte, a preparação para a próxima rodada já começou.\n\nO time voltou aos treinos nesta manhã, com foco na recuperação dos atletas e nos ajustes táticos.\n\nA expectativa é de estádio cheio no fim de semana. Os ingressos estarão disponíveis a partir de amanhã.",
      },
      {
        id: "encerramento",
        title: "Encerramento",
        type: "NOTA",
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
        text: "Interrompemos a nossa programação para uma informação importante.\n\nNossa equipe está acompanhando os acontecimentos. As informações confirmadas serão atualizadas nesta edição.\n\nVoltaremos com novos detalhes assim que houver confirmação.",
      },
    ],
  },
]

export const requirements = [
  [
    "RF01",
    "Gestão de roteiros",
    "Criar, editar, duplicar e excluir roteiros com blocos identificáveis.",
    "Parcial",
    "CRUD e persistência no navegador disponíveis; versionamento editorial pendente.",
  ],
  [
    "RF02",
    "Formatação editorial",
    "Estilos semânticos, destaques, pronúncias e texto não falado.",
    "Planejado",
    "Tamanho de leitura disponível. Editor rico e normalização de fala pendentes.",
  ],
  [
    "RF03",
    "Blocos e navegação",
    "Segmentos lógicos com âncoras estáveis e navegação explícita.",
    "Parcial",
    "Criação, edição e seleção de blocos disponíveis; publicação transacional pendente.",
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
    "Voice tracking offline",
    "Reconhecer e alinhar a fala localmente ao roteiro ativo.",
    "Planejado",
    "Nenhum modelo STT está conectado a esta versão.",
  ],
  [
    "RF08",
    "Autoridade manual",
    "Intervenção prioritária por teclado, wheel e periféricos.",
    "Parcial",
    "Espaço, setas e wheel disponíveis; pedal físico não integrado.",
  ],
  [
    "RF09",
    "Continuidade e reserva",
    "Saída preservada, réplica de estado e comutação homologada.",
    "Planejado",
    "Exige processos e equipamentos independentes; não simulada como ativa.",
  ],
  [
    "RF10",
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
