# Verificação dos alertas sonoros — 20/10/2026

## Resultado

- `npm test`: 35 testes passaram, nenhum falhou.
- `npm run build`: `index.html` atualizado com os sons embutidos, sem arquivos de áudio externos.
- Bipes nos últimos 5 segundos dos exercícios, transições e descansos entre sets.
- Preparação de 3 segundos com um aviso por segundo, inclusive antes do primeiro set.
- Mudança de fase cobre o primeiro segundo das fases curtas, sem duplicação.
- Conclusão com alarme ascendente de três notas, com duração total de 1,1 segundo.

## Conferência no navegador

O HTML gerado foi carregado no Chromium por uma rota interceptada. O relógio do
navegador foi acelerado e as chamadas ao Web Audio real foram instrumentadas
para conferir frequências e quantidade de notas; isso não confirma som audível.

- Circuito com 8 segundos por exercício, 7 de transição, 6 de descanso,
  2 exercícios por set e 2 sets: conclusão automática e sequência exata de
  51 notas, incluindo preparação, mudanças de fase, contagens finais e alarme.
- Pausa em `00:05`: tempo e quantidade de notas permaneceram inalterados
  durante 10 segundos; retomada sem duplicação e próximo bipe emitido.
- Encerramento manual: nenhum novo som durante os 60 segundos seguintes.

## Cobertura automatizada

Os testes verificam os limites de 5 a 1, preparação de cada set, fases curtas,
atrasos sem rajadas de bipes, pausa e retomada sem repetição, reinício,
conclusão única e comportamento sem áudio disponível. Há cobertura específica
para a pausa entre a virada do segundo e a próxima atualização: o bipe ainda
não emitido fica disponível na retomada.

## Ainda não verificado

Som audível, volume e modo silencioso no Safari de um iPhone real. Não houve
publicação nesta alteração; o arquivo pronto para publicar é `index.html`.
