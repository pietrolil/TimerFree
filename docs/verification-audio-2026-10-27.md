# Bipes junto com música no Safari — 27/10/2026

## Diagnóstico e comportamento escolhido

O usuário confirmou que a configuração anterior passou a impedir ouvir música
enquanto o timer estava ativo. Ela selecionava `playback` para permitir bipes
no modo silencioso, mas esse tipo de sessão é exclusivo e pode interromper a
música de outros apps.

O comportamento escolhido pelo usuário é somente “Com música”, sem adicionar
opções à tela. A correção seleciona `ambient` antes de criar ou retomar o
AudioContext. Essa categoria permite misturar áudio, mas no iPhone respeita o
modo silencioso: é necessário desativá-lo para ouvir os bipes junto com música.

Fontes primárias:
- [Audio Session — W3C](https://www.w3.org/TR/audio-session/).
- [Comportamento de mistura e modo silencioso no WebKit](https://bugs.webkit.org/show_bug.cgi?id=264473).

## Verificação

- Teste de regressão falhou antes da correção: o tipo exclusivo impedia abrir o
  contexto conforme o comportamento esperado para coexistir com música.
- O teste cobre a seleção da categoria antes de abrir o contexto, emissão do
  bipe e seleção de categoria novamente na retomada, preservando a música.
- A ausência ou rejeição da API opcional continua sem impedir o timer.
- npm test: 37 testes passaram, nenhum falhou; npm run build gerou index.html.
- No Chromium, o HTML gerado selecionou ambient e concluiu um circuito com
  o padrão exato de 51 notas, incluindo pausa/retomada. A política de sessão
  simulada manteve a música ativa; isso não substitui o teste físico no iPhone.
- Os testes e a geração do HTML são executados na cópia isolada da versão web;
  as alterações de Android na pasta original são preservadas.

## Limite da verificação

Os testes com política de sessão simulada não comprovam reprodução simultânea
em um iPhone real. É necessário confirmar música e bipes no Safari com o
modo silencioso desligado, além de pausa e retomada.
