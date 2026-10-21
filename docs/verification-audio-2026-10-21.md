# Áudio no modo silencioso do iPhone — 21/10/2026

## Diagnóstico e ajuste

O usuário informou ausência dos sons no Safari e confirmou que o iPhone estava
no modo silencioso. A implementação anterior utilizava Web Audio com a sessão
padrão, que no iOS pode ser tratada como áudio ambiente e respeitar o silencioso.

A correção seleciona `navigator.audioSession.type = 'playback'` durante o toque
em **Iniciar treino** ou **Continuar**, antes de criar ou retomar o AudioContext.
Esse ajuste é recomendado pelo próprio WebKit para esse caso:
[WebKit 251532](https://bugs.webkit.org/show_bug.cgi?id=251532).

A API é opcional. Sua ausência ou uma falha ao configurá-la não impede o timer
de funcionar. Em navegadores sem suporte, desativar o silencioso pode continuar
sendo necessário. O volume de mídia precisa estar audível.

## Verificação

- Teste novo falhou antes do ajuste e passou depois, simulando a política que
  bloqueia a sessão ambiente e exigindo `playback` antes de abrir o contexto.
- Outro teste preserva o funcionamento quando a configuração opcional é rejeitada.
- `npm test`: 37 testes passaram, nenhum falhou.
- `npm run build`: `index.html` regenerado com o ajuste.
- HTML gerado carregado no Chromium por uma rota interceptada, com Audio Session
  simulada e Web Audio real. O contexto foi aberto após selecionar `playback`;
  circuito de 2 exercícios por set e 2 sets (8s exercício, 7s transição, 6s descanso)
  concluiu com o padrão esperado de 51 notas, sem aviso de áudio indisponível.

## Confirmação pendente

Som audível no Safari de um iPhone real com o modo silencioso ligado. A simulação
e os testes locais não confirmam a saída física de áudio no aparelho.
