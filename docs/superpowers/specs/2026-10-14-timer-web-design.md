# Timer de treino por exercícios e sets — especificação da primeira versão

**Data:** 14/10/2026  
**Status:** desenho aprovado em conversa; aguardando revisão deste documento

## Objetivo

Criar um timer simples para treinos em circuito, acessível pelo navegador do iPhone. O usuário configura uma duração única para todos os exercícios, uma duração para trocar de exercício, um descanso entre sets e as quantidades de exercícios e sets. Depois de iniciar, a sequência avança automaticamente com avisos sonoros. Durante o treino, o tempo e a fase atual devem ser fáceis de ler à distância, e a página deve tentar manter a tela acesa.

O custo e a facilidade de publicação importam: a primeira versão será um site estático, sem servidor, conta, assinatura, banco de dados ou domínio próprio obrigatório. O artefato publicado será um único `index.html`, com CSS e JavaScript embutidos. O endereço precisa usar HTTPS para permitir a função de manter a tela acesa. A escolha do provedor de hospedagem fica para o plano de implementação; ele deve oferecer publicação estática gratuita com endereço próprio do provedor.

## Escopo

Incluído:

- Configuração de cinco valores: tempo de exercício, tempo de transição, descanso entre sets, quantidade de exercícios e quantidade de sets.
- Mesma duração de exercício para todos os exercícios; identificação apenas pelo número, sem cadastro de nomes.
- Execução automática de todas as fases e sets.
- Aviso sonoro no início de cada fase e aviso distinto no fim do treino.
- Tela de execução com contagem regressiva grande, tipo de fase, exercício atual, set atual e próxima fase.
- Controles para iniciar, pausar, continuar e encerrar o treino.
- Tentativa de manter a tela acesa enquanto o treino estiver em execução e a página estiver visível.
- Persistência da última configuração somente no armazenamento local do navegador.
- Layout adaptado a telas pequenas e operação por toque.

Fora desta versão: APK Android, publicação em lojas, contas, sincronização entre aparelhos, histórico de treinos, exercícios com nomes ou durações individuais, execução com a tela bloqueada, notificações em segundo plano e garantia de uso offline.

## Regras da sequência

1. O toque em **Iniciar** entra imediatamente no exercício 1 do set 1; não há contagem preparatória.
2. Depois de cada exercício que não seja o último do set, ocorre a transição configurada. A tela de transição informa qual exercício vem a seguir.
3. Depois do último exercício de um set que não seja o último, ocorre o descanso configurado. Ao terminar, o exercício 1 do próximo set começa automaticamente.
4. Depois do último exercício do último set, o treino termina imediatamente, sem transição nem descanso adicional.
5. Se transição ou descanso forem zero, a fase correspondente é omitida. O exercício ou set seguinte começa sem espera.
6. Um aviso sonoro marca a entrada em cada fase, inclusive no primeiro exercício. O fim usa um padrão diferente. A interface nunca depende apenas do som para informar a fase.

Exemplo com dois exercícios e dois sets: **Exercício 1 → Transição → Exercício 2 → Descanso → Exercício 1 → Transição → Exercício 2 → Fim**.

A duração planejada é `sets × (exercícios × exercício + (exercícios − 1) × transição) + (sets − 1) × descanso`. Isso é uma previsão; o tempo real pode aumentar se o usuário pausar.

## Entradas e estados da interface

- Os três tempos são editados em minutos e segundos. Exercício aceita de 00:01 a 99:59; transição e descanso aceitam de 00:00 a 99:59.
- Quantidades de exercícios e sets são números inteiros de 1 a 99. A interface impede início com valores inválidos e explica o campo a corrigir.
- A configuração mostra a duração planejada antes de iniciar.
- Durante a execução, a tela mostra `Exercício X de N` e `Set Y de M`; para transição, mostra também o próximo exercício. Descanso identifica o próximo set. Cor ajuda a distinguir fases, mas texto permanece suficiente para compreendê-las.
- Os controles de pausar/continuar e encerrar são grandes o suficiente para uso por toque. Encerrar volta à configuração preservando os valores. A tela de conclusão mostra que o treino terminou e permite iniciar outro treino.
- A última configuração válida é salva no navegador ao ser alterada. Se o armazenamento não estiver disponível ou contiver dados inválidos, o app usa valores iniciais válidos e continua funcional; isso não bloqueia o treino.
- O estado de um treino em andamento não precisa sobreviver ao recarregamento ou fechamento da página. Ao reabrir, volta à configuração salva.

## Contagem, pausa e visibilidade

- Ao iniciar, o app gera uma sequência determinística de fases a partir da configuração validada. O cronômetro usa uma referência de tempo decorrido, e não conta segundos subtraindo uma unidade por callback; assim, atrasos de desenho da tela não acumulam erro.
- Pausar congela o tempo restante da fase. Continuar retoma desse ponto. Controles repetidos não devem duplicar fases, sons ou timers.
- Quando a página deixa de estar visível, o app pausa o treino e libera a solicitação de tela acesa. Ao voltar, mostra o estado pausado; o usuário toca em **Continuar**. Nenhuma fase deve avançar automaticamente enquanto a página estiver oculta.
- Se o navegador não oferecer ou negar a função de manter a tela acesa, o treino continua e a interface mostra um aviso discreto. A solicitação é refeita ao continuar, quando apropriado, e liberada ao pausar, encerrar ou concluir.
- O áudio é habilitado pelo toque explícito em **Iniciar**. Se o navegador impedir reprodução, o treino continua com avisos visuais e informa que o som não está disponível. Volume, modo silencioso e comportamento específico do aparelho precisam de verificação no iPhone real.

## Publicação e privacidade

O `index.html` será publicado por um serviço de hospedagem estática com HTTPS. Não haverá chamadas a API, coleta de dados, analytics, login nem transmissão da configuração do treino. Os valores salvos pertencem ao navegador daquele aparelho e não aparecem automaticamente em outro dispositivo ou navegador. O site pode ser usado em outros navegadores modernos, mas o Safari no iPhone é o alvo principal de validação.

## Verificação e critérios de aceite

- Exercício único/set único termina diretamente, sem fases extras.
- Uma sequência com vários exercícios e sets segue exatamente as regras acima; transição não aparece depois do último exercício, e descanso não aparece depois do último set.
- Transição ou descanso em zero não criam uma fase visível de duração zero nem travam o avanço.
- Pausar e continuar preservam o tempo restante; sair da página pausa e requer retomada manual.
- O timer não acumula atraso perceptível após longos intervalos com a tela visível.
- A última configuração reaparece depois de recarregar a página; um treino em andamento não reaparece como se ainda estivesse rodando.
- Falhas de áudio, tela acesa ou armazenamento local deixam o timer utilizável e são comunicadas quando relevantes.
- A interface funciona em largura de iPhone, com contagem legível e controles utilizáveis por toque.
- Antes de considerar a experiência no iPhone confirmada, testar em Safari num iPhone real: sons em cada mudança, tela acesa durante todo o treino, pausa ao sair da página e retomada. Testes em navegador de computador ou emulação não substituem essa verificação.

## Decisões futuras

APK Android, instalação como aplicativo web, uso offline, presets nomeados e histórico ficam para uma decisão posterior, depois de validar a primeira versão web em treino real.
