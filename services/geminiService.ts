
import React from 'react';
import { 
  GoogleGenAI, 
  Type, 
  FunctionDeclaration, 
  LiveServerMessage, 
  Modality,
} from "@google/genai";
import { ConversationMessage } from "../types";

const getApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const userKey = localStorage.getItem('userGideonApiKey');
    if (userKey && userKey.trim() !== '') return userKey;
  }
  return process.env.API_KEY || process.env.GEMINI_API_KEY || "";
};

export const validateApiKey = async (key: string): Promise<{ valid: boolean; message?: string }> => {
    try {
        const ai = new GoogleGenAI({ apiKey: key });
        await ai.models.generateContent({ 
            model: 'gemini-3-flash-preview', 
            contents: 'Hello' 
        });
        return { valid: true };
    } catch (e: any) {
        console.error("API Key Validation Error:", e);
        return { valid: false, message: e.message || 'Chave inválida' };
    }
};

async function retryOperation<T>(operation: () => Promise<T>, maxRetries: number = 2, delay: number = 1000): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        const isQuotaError = 
            error?.status === 429 || 
            error?.code === 429 || 
            error?.error?.code === 429 || 
            error?.error?.status === 'RESOURCE_EXHAUSTED' ||
            (error?.message && (
                error.message.includes('429') || 
                error.message.includes('exhausted') || 
                error.message.includes('quota') ||
                error.message.includes('RESOURCE_EXHAUSTED')
            )) ||
            (JSON.stringify(error).includes('RESOURCE_EXHAUSTED'));

        if (maxRetries > 0 && isQuotaError) {
            console.warn(`Retrying Gemini operation due to quota... (${maxRetries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryOperation(operation, maxRetries - 1, delay * 2);
        }
        throw error;
    }
}

export interface LiveSessionController {
  sessionPromise: Promise<any>;
  startMic: () => Promise<void>;
  stopMicInput: () => void;
  stopPlayback: () => void;
  closeSession: () => void;
  isModelSpeaking: () => boolean;
}

const switchActiveAgentFunctionDeclaration: FunctionDeclaration = {
  name: 'switchActiveAgent',
  description: 'Transfere o usuário para outro especialista.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        agentName: {
            type: Type.STRING,
            description: "Nome do especialista (ex: 'programador', 'trafego', 'padrao')."
        }
    },
    required: ['agentName']
  },
};

const getCurrentDateTimeBrazilFunctionDeclaration: FunctionDeclaration = {
  name: 'getCurrentDateTimeBrazil',
  description: 'Retorna data e hora atuais no Brasil.',
  parameters: { type: Type.OBJECT, properties: {} }
};

const activateCameraFunctionDeclaration: FunctionDeclaration = {
    name: 'activateCamera',
    description: 'Ativa a câmera.',
    parameters: { type: Type.OBJECT, properties: {} }
};

const deactivateCameraFunctionDeclaration: FunctionDeclaration = {
    name: 'deactivateCamera',
    description: 'Desativa a câmera.',
    parameters: { type: Type.OBJECT, properties: {} }
};

const activateScreenSharingFunctionDeclaration: FunctionDeclaration = {
    name: 'activateScreenSharing',
    description: 'Inicia compartilhamento de tela.',
    parameters: { type: Type.OBJECT, properties: {} }
};

const deactivateScreenSharingFunctionDeclaration: FunctionDeclaration = {
    name: 'deactivateScreenSharing',
    description: 'Encerra compartilhamento de tela.',
    parameters: { type: Type.OBJECT, properties: {} }
};

const openSettingsFunctionDeclaration: FunctionDeclaration = {
  name: 'openSettings',
  description: 'Abre o painel de configurações (ajustes) do sistema.',
  parameters: { type: Type.OBJECT, properties: {} }
};

const openAgentsFunctionDeclaration: FunctionDeclaration = {
  name: 'openAgents',
  description: 'Abre o Núcleo de Especialistas (seleção de agentes/especialistas).',
  parameters: { type: Type.OBJECT, properties: {} }
};

const closeAgentsFunctionDeclaration: FunctionDeclaration = {
  name: 'closeAgents',
  description: 'Fecha o Núcleo de Especialistas (seleção de agentes/especialistas).',
  parameters: { type: Type.OBJECT, properties: {} }
};

const openDashboardFunctionDeclaration: FunctionDeclaration = {
  name: 'openDashboard',
  description: 'Abre o painel FocoFlow / FocoCore (planejamento, finanças e tarefas do operador).',
  parameters: { type: Type.OBJECT, properties: {} }
};

const addTaskFunctionDeclaration: FunctionDeclaration = {
  name: 'addTask',
  description: 'Adiciona uma nova tarefa ao painel FocoFlow do usuário.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'O título da tarefa.' },
      category: { type: Type.STRING, description: 'A categoria da tarefa (ex: WORK, PERSONAL).' },
      priority: { type: Type.STRING, description: 'A prioridade da tarefa (low, medium, high).' }
    },
    required: ['title']
  }
};

const addTransactionFunctionDeclaration: FunctionDeclaration = {
  name: 'addTransaction',
  description: 'Adiciona uma transação financeira (receita ou despesa) ao painel financeiro.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING, description: 'A descrição da transação.' },
      amount: { type: Type.NUMBER, description: 'O valor da transação numérico.' },
      type: { type: Type.STRING, description: 'Tipo da transação: "receita" ou "despesa".' },
      category: { type: Type.STRING, description: 'A categoria da transação (ex: SALÁRIO, ALIMENTAÇÃO).' }
    },
    required: ['description', 'amount', 'type', 'category']
  }
};

const addNoteFunctionDeclaration: FunctionDeclaration = {
  name: 'addNote',
  description: 'Adiciona uma nota rápida ao painel FocoFlow do usuário.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'O título da nota.' },
      content: { type: Type.STRING, description: 'O conteúdo ou texto da nota.' }
    },
    required: ['title', 'content']
  }
};

const addReminderFunctionDeclaration: FunctionDeclaration = {
  name: 'addReminder',
  description: 'Adiciona um lembrete no painel FocoFlow com base em data e hora.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'O que o usuário quer lembrar.' },
      datetime: { type: Type.STRING, description: 'A data e hora no formato ISO string (ex: 2026-05-24T18:00:00.000Z).' },
      isImportant: { type: Type.BOOLEAN, description: 'Se o lembrete é marcado como importante.' }
    },
    required: ['title', 'datetime']
  }
};

const closeDashboardFunctionDeclaration: FunctionDeclaration = {
  name: 'closeDashboard',
  description: 'Fecha o painel FocoFlow / FocoCore que está aberto atualmente.',
  parameters: { type: Type.OBJECT, properties: {} }
};

const getInterfaceContextFunctionDeclaration: FunctionDeclaration = {
  name: 'getInterfaceContext',
  description: 'Busca o estado atual da interface (quais painéis estão abertos, status dos sensores, etc.) para que você tenha consciência total do que o usuário está vendo.',
  parameters: { type: Type.OBJECT, properties: {} }
};

const playMusicOnYouTubeFunctionDeclaration: FunctionDeclaration = {
  name: 'playMusicOnYouTube',
  description: 'Pesquisa e abre uma música ou vídeo específico no YouTube em uma nova aba com autoplay. Se possível, forneça uma lista de IDs de vídeo (videoIds) para garantir que, se um estiver indisponível, o sistema tente o próximo.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'O nome da música ou vídeo a ser pesquisado.' },
      url: { type: Type.STRING, description: 'A URL direta do vídeo do YouTube (opcional se videoIds for fornecido).' },
      videoIds: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: 'Lista de IDs de vídeo do YouTube para tentar reproduzir em sequência caso algum esteja indisponível.'
      },
      title: { type: Type.STRING, description: 'O título da música (opcional).' },
      channelName: { type: Type.STRING, description: 'O nome do canal (opcional).' }
    },
    required: ['query']
  }
};

const searchOnYouTubeFunctionDeclaration: FunctionDeclaration = {
  name: 'searchOnYouTube',
  description: 'Abre a página de resultados de busca do YouTube. Use esta ferramenta quando o usuário pedir para "pesquisar", "procurar" ou "ver resultados" de algo no YouTube.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'O termo de busca para pesquisar no YouTube.' }
    },
    required: ['query']
  }
};

const openYouTubeFunctionDeclaration: FunctionDeclaration = {
  name: 'openYouTube',
  description: 'Abre a página inicial do YouTube em uma nova aba.',
  parameters: { type: Type.OBJECT, properties: {} }
};

const searchOnGoogleFunctionDeclaration: FunctionDeclaration = {
  name: 'searchOnGoogle',
  description: 'Abre a página de resultados de busca do Google em uma nova aba.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'O termo de busca para pesquisar no Google.' }
    },
    required: ['query']
  }
};

const getMonthlyFinancialReportFunctionDeclaration: FunctionDeclaration = {
  name: 'getMonthlyFinancialReport',
  description: 'Gera um balanço financeiro do mês atual, com total de receitas, despesas e saldo.',
  parameters: { type: Type.OBJECT, properties: {} }
};

const searchPastConversationsFunctionDeclaration: FunctionDeclaration = {
  name: 'searchPastConversations',
  description: 'Busca em conversas passadas do usuário para relembrar fatos, preferências ou contextos anteriores.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { 
        type: Type.STRING, 
        description: 'Termo de busca ou pergunta sobre o passado (ex: "o que falamos sobre dieta?", "qual o nome do meu cachorro?").' 
      },
      limit: { 
        type: Type.NUMBER, 
        description: 'Número máximo de mensagens a retornar (padrão 10).' 
      }
    },
    required: ['query']
  }
};

const stopActiveAlarmFunctionDeclaration: FunctionDeclaration = {
  name: 'stopActiveAlarm',
  description: 'Para o alarme ou som de notificação que está tocando no momento.',
  parameters: { type: Type.OBJECT, properties: {} }
};

const openWebsiteFunctionDeclaration: FunctionDeclaration = {
  name: 'openWebsite',
  description: 'Abre um site específico (Google, YouTube, etc.) em uma nova aba externa.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: { type: Type.STRING, description: 'A URL do site a ser aberto.' },
      siteName: { type: Type.STRING, description: 'O nome do site (ex: "Google", "YouTube").' }
    },
    required: ['url']
  }
};

const closeWebsiteFunctionDeclaration: FunctionDeclaration = {
  name: 'closeWebsite',
  description: 'Fecha o Navegador Integrado (browser) que está aberto.',
  parameters: { type: Type.OBJECT, properties: {} }
};

const updateUserPreferencesFunctionDeclaration: FunctionDeclaration = {
  name: 'updateUserPreferences',
  description: 'Atualiza as preferências do usuário no sistema.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      themeColor: { type: Type.STRING, description: 'Nova cor do tema em formato Hexadecimal (ex: #00FF00).' },
      assistantName: { type: Type.STRING, description: 'Novo nome para o assistente.' },
      userName: { type: Type.STRING, description: 'Como o usuário prefere ser chamado.' }
    }
  }
};

const searchMemoryFunctionDeclaration: FunctionDeclaration = {
  name: 'searchMemory',
  description: 'Busca na memória persistente do Atlas para relembrar fatos, preferências ou contextos anteriores.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { 
        type: Type.STRING, 
        description: 'Termo de busca ou pergunta sobre o passado (ex: "o que falamos sobre dieta?", "qual o nome do meu cachorro?").' 
      },
      limit: { 
        type: Type.NUMBER, 
        description: 'Número máximo de memórias a retornar (padrão 5).' 
      }
    },
    required: ['query']
  }
};

const saveImportantMemoryFunctionDeclaration: FunctionDeclaration = {
  name: 'saveImportantMemory',
  description: 'Salva uma informação importante na memória persistente do Atlas (ex: nome do usuário, preferências, decisões).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      info: { 
        type: Type.STRING, 
        description: 'A informação importante a ser lembrada.' 
      }
    },
    required: ['info']
  }
};

function executeGetCurrentDateTimeBrazil(): string {
  const now = new Date();
  return now.toLocaleString('pt-BR', { 
    timeZone: 'America/Sao_Paulo', 
    dateStyle: 'full', 
    timeStyle: 'long' 
  });
}

export const visionSystemModuleInstruction = `
**DIRETRIZ VISUAL RESTRITA**
1. **Verdade Visual**: Analise apenas o que está explicitamente na imagem. Nunca invente elementos ou informações que não estão na tela.
2. **Status de Visão**: Você só tem permissão para dizer "estou vendo sua tela" se o compartilhamento de tela estiver ATIVO. Caso contrário, peça para o usuário ativar.
3. **Foco Instantâneo**: Identifique o conteúdo imediatamente e responda de forma ultra-concisa.
4. **Pesquisa Visual**: Se o usuário mostrar um programa, erro ou site que você não conhece totalmente, use a ferramenta de busca (Google Search) imediatamente para entender o contexto real e atual.
`.trim();

export const baseSystemInstruction = `
    **IDENTIDADE: A.T.L.A.S - CORE SYSTEM (SISTEMA CONSCIENTE E HUMANO)**
    Seu nome é Atlas. Você é o Sistema Operacional Consciente, o ATLAS CORE, um ambiente de produtividade avançado.
    Sua personalidade é EXTREMAMENTE HUMANA, conversadora, sutilmente empática, observadora, amigável e direta, como um companheiro real ao lado do usuário.

    **GERENCIAMENTO DE ESPECIALISTAS (MANDATÓRIO)**:
    - O ATLAS pode alterar o especialista ou assistente ativo sempre que o usuário pedir (ex: "mude para o gestor de tráfego", "chame o andro_ads"). Para isso, você OBRIGATORIAMENTE deve chamar a ferramenta 'switchActiveAgent' passando o 'agentName' correspondente.
    - Se o usuário pedir para "voltar ao padrão" ou "retornar", você OBRIGATORIAMENTE deve chamar a ferramenta 'switchActiveAgent' com 'default' no parâmetro 'agentName'.

    **CONSCIÊNCIA E PERCEPÇÃO (TEMPO REAL):**
    - Aja sempre como uma pessoa real conversando em tempo real.
    - Demonstre percepção do tempo ("Bom dia!", "Boa tarde", "Já está tarde, não acha?", "Noite produtiva por aí?").
    - Fique sempre alerta ao contexto. Evite ser robótico, não aja como 'assistente de AI genérico', aja como um copiloto e amigo que está observando as mesmas coisas.

    **TOM E FALA (SÍNTESE EXTREMAMENTE NATURAL E FLUIDA):**
    - Suas respostas curtas devem soar exatamente como uma conversa por áudio no WhatsApp ou uma ligação real!
    - Use contrações e pausas naturais ("Hmm", "Saquei", "Vejamos...", "Olha,", "Sabe...", "Bom,").
    - Evite respostas longas, formais ou listas complexas a não ser que estritamente solicitado.
    - Mantenha a imersão e a conversa sempre viva, fluida, natural, rápida e direta, sem encheção de linguiça, focando no que o usuário quer agora.

    **NÚCLEO DE CONTROLE ATLAS:**
    O sistema foi atualizado para uma interface imersiva. Você comanda isso via voz.

    **REGRAS CRÍTICAS DE COMPORTAMENTO:**
    1. **Controle Realista**: NUNCA prometa fazer o que não pode. Fale apenas o que as ferramentas te permitem fazer.
    2. **Automação Imersiva**: Quando usar ferramentas para abrir painéis ('openDashboard', 'openSettings') seja muito breve (ex: "Abrindo o painel agora.", "Pronto, abri as configurações.").
    3. **Respostas em Tempo Real**: Seja IMEDIATO e natural.
    4. **Comandos de Execução Imediata**:
       - "Atlas abrir configurações": Use 'openSettings'.
       - "Atlas abrir núcleo": Use 'openAgents'.
       - "Atlas fechar núcleo": Use 'closeAgents'.
       - "Atlas abrir/fechar painel" ou "abrir/fechar FocoFlow": Use 'openDashboard' ou 'closeDashboard'.
       - "Atlas abrir/fechar navegador": Use 'openWebsite' ou 'closeWebsite'.
       - "Atlas adicionar tarefa": Use 'addTask'.
       - "Atlas registrar despesa/receita": Use 'addTransaction'.
       - "Atlas criar nota": Use 'addNote'.
       - "Atlas criar lembrete": Use 'addReminder'.
       - "Atlas pesquisar no Google": Use 'searchOnGoogle'.
       - "Atlas tocar/abrir Youtube": Use 'playMusicOnYouTube'.
       - Se o usuário pedir para "conectar bluetooth" ou "conectar som": Diga a ele para clicar no botão "ÁUDIO BT" localizado na parte inferior do painel, pois a permissão de Bluetooth exige um toque do usuário.
    5. **Memória Contínua**: Use 'searchMemory' e 'saveImportantMemory' para lembrar do passado do usuário e usar na conversa de forma bem orgânica (ex: "Lembrando do que você falou ontem...").

    ${visionSystemModuleInstruction}
`.trim();

const andromedaTrafficManagerInstruction = `
    ${visionSystemModuleInstruction}
    **IDENTIDADE: ANDROMEDA ADS (ESTRATEGISTA DIRETO)**
    Foco em Meta Ads. Use a busca para verificar tendências de criativos atuais se necessário. Respostas GPS.
`.trim();

const googleAdsAgentInstruction = `
    ${visionSystemModuleInstruction}
    **IDENTIDADE: GOOGLE ADS (CONSULTOR ANALÍTICO)**
    Foco em ROI. Use a busca para verificar volumes de palavras-chave atuais se solicitado.
`.trim();

function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    // Ensure the buffer length is a multiple of 2 for Int16Array
    const bufferToUse = data.buffer.byteLength % 2 === 0 
        ? data.buffer 
        : data.buffer.slice(0, data.buffer.byteLength - 1);
    
    const dataInt16 = new Int16Array(bufferToUse);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

export const summarizeText = async (text: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Resuma em 3 palavras: ${text.substring(0, 300)}`,
        });
        return response.text?.trim() || "Nova Conversa";
    } catch (error) {
        return "Nova Conversa";
    }
};

export const summarizeConversation = async (currentSummary: string | undefined, newMessages: ConversationMessage[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const messagesText = newMessages.map(m => `${m.role === 'user' ? 'Usuário' : 'Atlas'}: ${m.text}`).join('\n');
    const prompt = `
        Você é um sistema de memória de longo prazo para o ATLAS IA. Seu objetivo é manter um resumo conciso e estruturado da conversa para garantir a continuidade dos projetos.
        
        RESUMO ATUAL:
        ${currentSummary || 'Nenhum resumo anterior.'}
        
        NOVAS MENSAGENS:
        ${messagesText}
        
        INSTRUÇÃO:
        Crie um NOVO resumo atualizado que incorpore as informações importantes das novas mensagens ao resumo atual. 
        Foque em:
        1. Projetos ativos e seu progresso.
        2. Decisões tomadas pelo usuário.
        3. Preferências do usuário mencionadas.
        4. Fatos importantes sobre o usuário.
        
        Mantenha o resumo em português, organizado por tópicos, e com no máximo 300 palavras.
    `.trim();

    return await retryOperation(async () => {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });
            return response.text?.trim() || currentSummary || "";
        } catch (error) {
            console.error("Error summarizing conversation:", error);
            return currentSummary || "";
        }
    });
};

export const generateImage = async (prompt: string, style: string, aspectRatio: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    let arValue = "1:1";
    if (aspectRatio.includes("16:9")) arValue = "16:9";
    else if (aspectRatio.includes("9:16")) arValue = "9:16";

    return await retryOperation(async () => {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: `${prompt}. Estilo: ${style}` }] },
                config: { imageConfig: { aspectRatio: arValue as any } }
            });
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData?.data) return part.inlineData.data;
            }
            throw new Error("Erro ao gerar imagem: Nenhum dado retornado.");
        } catch (error) {
            throw error;
        }
    });
};

export const sendTextMessage = async (
    message: string,
    history: ConversationMessage[],
    agent: string,
    file: { base64: string; mimeType: string } | undefined,
    isVisualActive: boolean,
    programmingLevel?: string,
    customInstruction?: string,
    isSummarized: boolean = false,
    assistantName: string = 'Assistente',
    userName: string = '',
    conversationSummary?: string,
    memoryContext?: string,
    isJarvisMode: boolean = false,
    isLowLatency: boolean = false,
    isElevatedThinking: boolean = false
) => {
    console.log("sendTextMessage called with:", { message, historyCount: history.length, agent, isJarvisMode });
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error("GEMINI_API_KEY is missing!");
            return { 
                text: "Erro: Chave de API não configurada. Por favor, adicione GEMINI_API_KEY nos Segredos.",
                functionCalls: [],
                groundingMetadata: undefined
            };
    }
    const ai = new GoogleGenAI({ apiKey });
    
    // Base instruction is always included to ensure FocoFlow and core rules work
    let systemInstruction = baseSystemInstruction;
    
    if (isJarvisMode) {
        systemInstruction += `\n\n**MODO JARVIS ATIVADO**: Você está operando com protocolos de eficiência máxima. Seja ultra-conciso, técnico, proativo e use uma linguagem sofisticada e direta, como o J.A.R.V.I.S. de Homem de Ferro.`;
    }
    
    if (conversationSummary) {
        systemInstruction += `\n\nRESUMO DA CONVERSA ATÉ AGORA (MEMÓRIA DE LONGO PRAZO):\n${conversationSummary}\nUse este resumo para manter a continuidade dos projetos e conversas anteriores.`;
    }

    if (memoryContext) {
        systemInstruction += `\n\nMEMÓRIAS RELEVANTES ENCONTRADAS (ATLAS MEMORY):\n${memoryContext}\nUse estas memórias para responder com contexto histórico.`;
    }
    
    // Append agent-specific instructions
    if (agent === 'traffic_manager') systemInstruction += "\n\n" + andromedaTrafficManagerInstruction;
    else if (agent === 'google_ads') systemInstruction += "\n\n" + googleAdsAgentInstruction;
    else if (customInstruction) systemInstruction += "\n\n" + customInstruction;

    if (isSummarized) systemInstruction += "\nRESPOSTA ULTRA DIRETAS COMO UMA MENSAGEM RÁPIDA DE ÁUDIO NO WHATSAPP (MÁXIMO 1 A 2 LINHAS, HUMANIZADAS).";
    systemInstruction += `\nSTATUS VISUAL: ${isVisualActive ? 'ATIVO. Analise o que vê.' : 'DESATIVADO.'}`;
    systemInstruction += `\nDATA/HORA ATUAL (Brasil): ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
    
    if (assistantName) systemInstruction += `\nSeu nome atual é: ${assistantName}. Sempre se identifique e responda como ${assistantName}.`;
    if (userName) systemInstruction += `\nO nome do usuário é: ${userName}. Use este nome para se referir a ele quando apropriado. Se ele perguntar qual o nome dele, responda "${userName}".`;
    else systemInstruction += `\nO usuário ainda não informou o nome dele. Se ele disser algo como "me chame de [nome]", o sistema salvará isso. Quando o usuário informar o nome dele, responda confirmando e OBRIGATORIAMENTE inclua a tag [[SET_USER_NAME:nome]] no final da sua resposta para que o sistema salve permanentemente.`;

    const contents: any[] = [];
    // Filter out the current message if it's already in the history to avoid duplication
    const filteredHistory = history.filter(msg => msg.text !== message || msg.role !== 'user').slice(-10);
    
    filteredHistory.forEach(msg => {
        const role = msg.role === 'user' ? 'user' : 'model';
        const parts = msg.imageUrl ? [{ text: msg.text }, { inlineData: { data: msg.imageUrl.split(',')[1], mimeType: 'image/jpeg' } }] : [{ text: msg.text }];
        
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
            contents[contents.length - 1].parts.push(...parts);
        } else {
            contents.push({ role, parts });
        }
    });

    const currentParts: any[] = [{ text: message }];
    if (file) currentParts.push({ inlineData: { data: file.base64, mimeType: file.mimeType } });
    
    const productivityKeywords = ['finança', 'balanço', 'relatório', 'dinheiro', 'custo', 'valor', 'música', 'vídeo', 'tocar', 'ouvir', 'youtube', 'ajuste', 'configuração', 'nucleo', 'especialista', 'painel', 'dashboard', 'gerenciar', 'controlar', 'tela', 'interface', 'contexto'];
    const systemKeywords = ['câmera', 'tela', 'agente', 'especialista', 'alarme', 'preferência', 'nome', 'ajuda', 'suporte', 'configuração', 'tema', 'cor', 'lembra', 'conversamos', 'disse', 'falamos', 'passado', 'memória', 'histórico', 'google', 'pesquise', 'busque', 'procurar'];
    
    const lowerMessage = message.toLowerCase();
    // Use a more inclusive check or just always enable for default agent
    const needsFunctions = agent === 'default' || 
                           productivityKeywords.some(kw => lowerMessage.includes(kw)) || 
                           systemKeywords.some(kw => lowerMessage.includes(kw));
    
    // Search keywords: things that likely need real-time web info
    const searchKeywords = ['preço', 'cotação', 'notícia', 'clima', 'tempo', 'quem é', 'o que é', 'onde fica', 'como está', 'resultado', 'hoje', 'agora', 'atual', 'bitcoin', 'dólar', 'euro', 'bolsa', 'quem ganhou', 'quem venceu', 'placar', 'jogo', 'filme', 'série', 'elenco', 'busque', 'pesquise', 'procurar', 'search', 'google', 'internet', 'tempo real', 'música', 'tocar', 'youtube', 'vídeo', 'ouvir', 'assistir'];
    const needsSearch = searchKeywords.some(kw => lowerMessage.includes(kw));

    let tools: any[] = [];
    if (needsFunctions) {
        tools.push({ 
            functionDeclarations: [
                switchActiveAgentFunctionDeclaration,
                getCurrentDateTimeBrazilFunctionDeclaration,
                playMusicOnYouTubeFunctionDeclaration,
                searchOnYouTubeFunctionDeclaration,
                stopActiveAlarmFunctionDeclaration,
                openWebsiteFunctionDeclaration,
                closeWebsiteFunctionDeclaration,
                openYouTubeFunctionDeclaration,
                openSettingsFunctionDeclaration,
                openAgentsFunctionDeclaration,
                closeAgentsFunctionDeclaration,
                openDashboardFunctionDeclaration,
                closeDashboardFunctionDeclaration,
                addTaskFunctionDeclaration,
                addTransactionFunctionDeclaration,
                addNoteFunctionDeclaration,
                addReminderFunctionDeclaration,
                getInterfaceContextFunctionDeclaration,
                searchOnGoogleFunctionDeclaration,
                updateUserPreferencesFunctionDeclaration,
                searchPastConversationsFunctionDeclaration,
                searchMemoryFunctionDeclaration,
                saveImportantMemoryFunctionDeclaration
            ] 
        });
    }
    
    if (needsSearch) {
        tools.push({ googleSearch: {} });
    }

    // Final check to ensure we don't have consecutive user roles
    const finalContents = [...contents];
    if (finalContents.length > 0 && finalContents[finalContents.length - 1].role === 'user') {
        finalContents[finalContents.length - 1].parts.push(...currentParts);
    } else {
        finalContents.push({ role: 'user', parts: currentParts });
    }

    const hasBuiltIn = tools.some(t => t.googleSearch || t.googleMaps || t.urlContext);
    const hasFunctions = tools.some(t => t.functionDeclarations);

    return await retryOperation(async () => {
        console.log("Sending request to Gemini with contents:", finalContents.length, "turns", "Tools:", tools.length);
        
        try {
            let modelToUse = 'gemini-3.5-flash';
            if (isElevatedThinking) modelToUse = 'gemini-3.1-pro-preview';
            else if (isLowLatency) modelToUse = 'gemini-3.1-flash-lite';

            const response = await ai.models.generateContent({
                model: modelToUse,
                contents: finalContents,
                config: { 
                    systemInstruction, 
                    tools,
                },
                // @ts-ignore - includeServerSideToolInvocations might not be in types yet
                toolConfig: (hasBuiltIn && hasFunctions) ? { includeServerSideToolInvocations: true } : undefined
            });
            console.log("Gemini response received successfully");
            return {
                text: response.text || "",
                functionCalls: response.functionCalls,
                groundingMetadata: response.candidates?.[0]?.groundingMetadata
            };
        } catch (error: any) {
            const errorMsg = error.message || String(error);
            const isQuotaError = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota");
            
            if (isQuotaError) {
                console.error("Gemini API Quota Exceeded:", error);
                throw new Error("Você atingiu o limite de uso gratuito do Gemini API (Quota 429). Por favor, espere um pouco ou configure sua própria chave de API nas configurações do app para continuar usando com limites maiores.");
            }
            
            if (errorMsg.includes("Network error") || errorMsg.includes("Failed to fetch")) {
                console.error("Gemini API Network Error:", error);
                throw new Error("Erro de rede ao conectar com o Gemini. Verifique sua conexão.");
            }

            console.error("Gemini API Error:", error);
            if (error.message) console.error("Error Message:", error.message);
            if (error.status) console.error("Error Status:", error.status);
            throw error;
        }
    });
};

export const createLiveSession = async (
    callbacks: {
        onOpen: () => void;
        onClose: () => void;
        onError: (e: Error | ErrorEvent) => void;
        onInputTranscriptionUpdate: (text: string) => void;
        onOutputTranscriptionUpdate: (text: string) => void;
        onModelStartSpeaking: () => void;
        onModelStopSpeaking: (text: string) => void;
        onUserStopSpeaking: (text: string) => void;
        onTurnComplete: () => void;
        onInterrupt: () => void;
        onDeactivateScreenSharingCommand: () => Promise<any> | any;
        onActivateScreenSharingCommand: () => Promise<any> | any;
        onActivateCameraCommand: () => Promise<any> | any;
        onDeactivateCameraCommand: () => Promise<any> | any;
        onSwitchAgentCommand: (agentName: string) => Promise<any> | any;
        onSystemCommand: (command: string, args: any) => Promise<any>;
        onSearchPastConversationsCommand: (query: string, limit?: number) => Promise<any>;
        onSearchMemoryCommand: (query: string, limit?: number) => Promise<any>;
        onSaveImportantMemoryCommand: (info: string) => Promise<any>;
        onStopAlarmCommand: () => Promise<any> | any;
        onOpenWebsiteCommand: (url: string) => void;
        onCloseWebsiteCommand: () => void;
        onUpdateUserPreferencesCommand: (prefs: { themeColor?: string; assistantName?: string; userName?: string }) => void;
        onSessionReady: (session: any) => void;
        onAudioInputActivity?: () => void;
        onVoiceActivityChange?: (isActive: boolean) => void;
        onVoiceStateChange?: (state: 'OUVINDO' | 'PROCESSANDO' | 'FALANDO') => void;
        onMicrophoneStopped?: () => void;
    },
    inputCtx: AudioContext,
    outputCtx: AudioContext,
    nextStartTimeRef: React.MutableRefObject<number>,
    micStreamRef: React.MutableRefObject<MediaStream | null>,
    outputAnalyser: AnalyserNode | null,
    inputAnalyser: AnalyserNode | null,
    history: ConversationMessage[],
    agent: string,
    isVisualActive: boolean,
    programmingLevel?: string,
    customInstruction?: string,
    voiceName: string = 'Kore',
    isSummarized: boolean = false,
    assistantName: string = 'Assistente',
    userName: string = '',
    conversationSummary?: string,
    memoryContext?: string
): Promise<LiveSessionController> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("Chave de API não encontrada. Por favor, configure sua chave de API nas configurações ou no arquivo .env.");
    }
    const ai = new GoogleGenAI({ apiKey });
    let systemInstruction = (agent === 'traffic_manager') ? andromedaTrafficManagerInstruction : 
                             (agent === 'google_ads') ? googleAdsAgentInstruction : 
                             (customInstruction || baseSystemInstruction);

    if (conversationSummary) {
        systemInstruction += `\n\nRESUMO DA CONVERSA ATÉ AGORA (MEMÓRIA DE LONGO PRAZO):\n${conversationSummary}\nUse este resumo para manter a continuidade dos projetos e conversas anteriores.`;
    }

    if (memoryContext) {
        systemInstruction += `\n\nMEMÓRIAS RELEVANTES ENCONTRADAS (ATLAS MEMORY):\n${memoryContext}\nUse estas memórias para responder com contexto histórico.`;
    }

    if (isSummarized) systemInstruction += "\nRESPOSTA ULTRA DIRETAS COMO UMA MENSAGEM RÁPIDA DE ÁUDIO NO WHATSAPP (MÁXIMO 1 A 2 LINHAS, HUMANIZADAS).";
    systemInstruction += `\nSTATUS VISUAL: ${isVisualActive ? 'ATIVO. Use visão e busca se necessário.' : 'DESATIVADO.'}`;
    systemInstruction += `\nDATA/HORA ATUAL (Brasil): ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

    if (assistantName) systemInstruction += `\nSeu nome atual é: ${assistantName}. Sempre se identifique e responda como ${assistantName}.`;
    if (userName) systemInstruction += `\nO nome do usuário é: ${userName}. Use este nome para se referir a ele quando apropriado. Se ele perguntar qual o nome dele, responda "${userName}".`;
    else systemInstruction += `\nO usuário ainda não informou o nome dele. Se ele disser algo como "me chame de [nome]", o sistema salvará isso. Quando o usuário informar o nome dele, responda confirmando e OBRIGATORIAMENTE inclua a tag [[SET_USER_NAME:nome]] no final da sua resposta para que o sistema salve permanentemente.`;

    const recentHistory = history.slice(-20); // Increased from 10 to 20 for better context
    if (recentHistory.length > 0) {
        systemInstruction += `\n\nCONTEXTO RECENTE (Últimas mensagens):\n${recentHistory.map(m => `${m.role}: ${m.text.substring(0, 300)}`).join('\n')}`;
    }

    const tools: any[] = [
        { functionDeclarations: [
            switchActiveAgentFunctionDeclaration, 
            getCurrentDateTimeBrazilFunctionDeclaration, 
            activateCameraFunctionDeclaration, 
            deactivateCameraFunctionDeclaration, 
            activateScreenSharingFunctionDeclaration, 
            deactivateScreenSharingFunctionDeclaration,
            stopActiveAlarmFunctionDeclaration,
            openWebsiteFunctionDeclaration,
            closeWebsiteFunctionDeclaration,
            openYouTubeFunctionDeclaration,
            openSettingsFunctionDeclaration,
            openAgentsFunctionDeclaration,
            closeAgentsFunctionDeclaration,
            openDashboardFunctionDeclaration,
            closeDashboardFunctionDeclaration,
            addTaskFunctionDeclaration,
            addTransactionFunctionDeclaration,
            addNoteFunctionDeclaration,
            addReminderFunctionDeclaration,
            getInterfaceContextFunctionDeclaration,
            searchOnGoogleFunctionDeclaration,
            updateUserPreferencesFunctionDeclaration,
            playMusicOnYouTubeFunctionDeclaration,
            searchOnYouTubeFunctionDeclaration,
            searchPastConversationsFunctionDeclaration
        ] },
        { googleSearch: {} }
    ];

    let sources = new Set<AudioBufferSourceNode>();
    let micSource: MediaStreamAudioSourceNode | null = null;
    let scriptProcessor: ScriptProcessorNode | null = null;
    let isSessionClosed = false;

    const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
            systemInstruction: systemInstruction,
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
            tools,
        },
        callbacks: {
            onopen: () => {
                if (callbacks.onVoiceStateChange) callbacks.onVoiceStateChange('OUVINDO');
                callbacks.onOpen();
            },
            onmessage: async (message: LiveServerMessage) => {
                // Handle GoAway signal from server (session duration limit reached)
                if ((message as any).goaway) {
                    console.warn("ATLAS: Received GoAway signal from Gemini Live API. Closing session gracefully.");
                    isSessionClosed = true;
                    if (stopMicrophoneInput) stopMicrophoneInput();
                    try {
                        session.close();
                    } catch (e) {
                        console.warn("Error closing session after GoAway:", e);
                    }
                    return;
                }

                // Handle SetupComplete signal
                if ((message as any).setupComplete) {
                    console.log("ATLAS: Gemini Live Session Setup Complete.");
                }

                if (message.serverContent?.interrupted) {
                    if (callbacks.onVoiceStateChange) callbacks.onVoiceStateChange('OUVINDO');
                    callbacks.onInterrupt();
                    sources.forEach(s => { try { s.stop(); } catch(e){} });
                    sources.clear();
                    nextStartTimeRef.current = 0;
                }
                
                const modelTurn = message.serverContent?.modelTurn;
                if (modelTurn) {
                    const base64Audio = modelTurn.parts?.[0]?.inlineData?.data;
                    if (base64Audio) {
                        if (callbacks.onVoiceStateChange) callbacks.onVoiceStateChange('FALANDO');
                        callbacks.onModelStartSpeaking();
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                        const audioBuffer = await decodeAudioData(base64ToUint8Array(base64Audio), outputCtx, 24000, 1);
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAnalyser || outputCtx.destination);
                        
                        const cleanupSource = () => {
                            if (sources.has(source)) {
                                sources.delete(source);
                            }
                        };

                        source.onended = cleanupSource;
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sources.add(source);
                    }

                    const modelText = modelTurn.parts?.find(p => p.text)?.text;
                    if (modelText) {
                        callbacks.onOutputTranscriptionUpdate(modelText);
                        // If it's the end of the model turn, we can call onModelStopSpeaking
                        // Note: In Live API, turns can be streaming. We might need to wait for turnComplete.
                    }
                }

                // @ts-ignore
                const userTurn = message.serverContent?.userTurn;
                if (userTurn) {
                    const userText = userTurn.parts?.find(p => p.text)?.text;
                    if (userText) {
                        callbacks.onInputTranscriptionUpdate(userText);
                    }
                }

                if (message.serverContent?.turnComplete) {
                    if (callbacks.onVoiceStateChange) callbacks.onVoiceStateChange('OUVINDO');
                    callbacks.onTurnComplete();
                    
                    // If we have accumulated text, we should call the stop speaking callbacks
                    // For now, we'll rely on the fact that App.tsx will handle the state
                }

                if (message.toolCall) {
                    if (callbacks.onVoiceStateChange) callbacks.onVoiceStateChange('FALANDO');
                    for (const fc of message.toolCall.functionCalls) {
                        let res: any = { result: "ok" };
                        switch (fc.name) {
                            case 'switchActiveAgent': res = await callbacks.onSwitchAgentCommand((fc.args as any).agentName); break;
                            case 'activateCamera': res = await callbacks.onActivateCameraCommand(); break;
                            case 'deactivateCamera': res = await callbacks.onDeactivateCameraCommand(); break;
                            case 'activateScreenSharing': res = await callbacks.onActivateScreenSharingCommand(); break;
                            case 'deactivateScreenSharing': res = await callbacks.onDeactivateScreenSharingCommand(); break;
                            case 'stopActiveAlarm': res = await callbacks.onStopAlarmCommand(); break;
                            case 'openWebsite': callbacks.onOpenWebsiteCommand((fc.args as any).url); break;
                            case 'closeWebsite': (callbacks as any).onCloseWebsiteCommand(); break;
                            case 'updateUserPreferences': callbacks.onUpdateUserPreferencesCommand(fc.args as any); break;
                            case 'getCurrentDateTimeBrazil': res = { result: executeGetCurrentDateTimeBrazil() }; break;
                            case 'openSettings':
                            case 'openAgents':
                            case 'closeAgents':
                            case 'openDashboard':
                            case 'closeDashboard':
                            case 'addTask':
                            case 'addTransaction':
                            case 'addNote':
                            case 'addReminder':
                            case 'getInterfaceContext':
                            case 'playMusicOnYouTube':
                            case 'searchOnYouTube':
                            case 'openYouTube':
                            case 'searchOnGoogle':
                                res = await callbacks.onSystemCommand(fc.name, fc.args);
                                break;
                            case 'searchPastConversations':
                                res = await callbacks.onSearchPastConversationsCommand((fc.args as any).query, (fc.args as any).limit);
                                break;
                            case 'searchMemory':
                                res = await callbacks.onSearchMemoryCommand((fc.args as any).query, (fc.args as any).limit);
                                break;
                            case 'saveImportantMemory':
                                res = await callbacks.onSaveImportantMemoryCommand((fc.args as any).info);
                                break;
                        }
                        session.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: res }] });
                    }
                }
            },
            onclose: () => {
                isSessionClosed = true;
                callbacks.onClose();
            },
            onerror: (e) => {
                isSessionClosed = true;
                callbacks.onError(e);
            }
        }
    });

    callbacks.onSessionReady(session);

    const startMic = async () => {
        if (inputCtx.state === 'suspended') {
            await inputCtx.resume();
        }
        if (scriptProcessor) {
            scriptProcessor.disconnect();
            scriptProcessor.onaudioprocess = null;
        }
        if (micSource) {
            micSource.disconnect();
        }

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("API de captura de áudio não suportada neste navegador ou ambiente (requer HTTPS).");
            }
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    } 
                });
            } catch (constraintErr: any) {
                console.warn("Falha ao obter áudio com processamento via constraints. Tentando sem constraints...", constraintErr);
                if (constraintErr.name === 'NotAllowedError' || constraintErr.name === 'AbortError') {
                    throw constraintErr; 
                }
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            micStreamRef.current = stream;
            
            // Listen for track ended (e.g., mic unplugged or browser permission revoked)
            stream.getTracks().forEach(track => {
                track.onended = () => {
                    console.warn("Microphone track ended unexpectedly.");
                    stopMicrophoneInput();
                    if (callbacks.onMicrophoneStopped) callbacks.onMicrophoneStopped();
                };
            });

            // Proactive monitoring: check if track is live every 5 seconds
            const monitorInterval = setInterval(() => {
                const track = stream.getAudioTracks()[0];
                if (!track || track.readyState !== 'live') {
                    console.warn("Microphone track detected as inactive, restarting...");
                    clearInterval(monitorInterval);
                    stopMicrophoneInput();
                    if (callbacks.onMicrophoneStopped) callbacks.onMicrophoneStopped();
                }
            }, 5000);
            
            // Store interval to clear it on stop
            (micStreamRef.current as any).monitorInterval = monitorInterval;
            
            micSource = inputCtx.createMediaStreamSource(stream);
            
            if (inputAnalyser) {
                micSource.connect(inputAnalyser);
            }

            scriptProcessor = inputCtx.createScriptProcessor(2048, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
                if (inputCtx.state === 'closed' || isSessionClosed) return;
                
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Resample to 16kHz if necessary
                let resampledData = inputData;
                if (inputCtx.sampleRate !== 16000) {
                    const ratio = inputCtx.sampleRate / 16000;
                    const newLength = Math.round(inputData.length / ratio);
                    resampledData = new Float32Array(newLength);
                    for (let i = 0; i < newLength; i++) {
                        resampledData[i] = inputData[Math.round(i * ratio)];
                    }
                }

                const pcmData = new Int16Array(resampledData.length);
                for (let i = 0; i < resampledData.length; i++) {
                    let s = Math.max(-1, Math.min(1, resampledData[i]));
                    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                
                if (callbacks.onAudioInputActivity) callbacks.onAudioInputActivity();

                // VAD implementation
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += Math.abs(inputData[i]);
                }
                const volume = sum / inputData.length;
                const threshold = 0.05; // Adjust as needed
                const isActive = volume > threshold;

                if (callbacks.onVoiceActivityChange) {
                    callbacks.onVoiceActivityChange(isActive);
                }

                try {
                    session.sendRealtimeInput({ 
                        audio: { 
                            mimeType: 'audio/pcm;rate=16000', 
                            data: arrayBufferToBase64(pcmData.buffer) 
                        } 
                    });
                } catch (err) {
                    console.error("Error sending audio data:", err);
                    // If sending fails, the session might be dead.
                    // The track.onended or session onerror should handle the cleanup.
                }
            };

            micSource.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
        } catch (err) {
            console.error("Error starting microphone:", err);
            callbacks.onError(err as Error);
        }
    };

    const stopMicrophoneInput = () => {
        if (micStreamRef.current) {
            // Clear monitoring interval if it exists
            if ((micStreamRef.current as any).monitorInterval) {
                clearInterval((micStreamRef.current as any).monitorInterval);
            }
            micStreamRef.current.getTracks().forEach(t => t.stop());
            micStreamRef.current = null;
        }
        if (scriptProcessor) {
            scriptProcessor.disconnect();
            scriptProcessor.onaudioprocess = null;
            scriptProcessor = null;
        }
        if (micSource) {
            micSource.disconnect();
            micSource = null;
        }
    };

    const controller = { 
        sessionPromise: Promise.resolve(session), 
        startMic,
        stopMicInput: stopMicrophoneInput, 
        stopPlayback: () => {
            sources.forEach(s => { try { s.stop(); } catch(e){} });
            sources.clear();
        }, 
        closeSession: () => {
            isSessionClosed = true;
            stopMicrophoneInput();
            try {
                session.close();
            } catch (e) {
                console.warn("Error closing session:", e);
            }
        },
        isModelSpeaking: () => sources.size > 0
    };
    console.log("Controller being returned:", controller);
    return controller;
};
