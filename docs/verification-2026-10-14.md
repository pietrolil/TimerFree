# Verificação local — 14/10/2026

## Resultado

- `npm ci`: instalação limpa concluída.
- `npm test`: 26 testes passaram, nenhum falhou.
- `npm run build`: gerou `index.html` com um `<style>` e um `<script>` embutidos, sem referências a recursos externos.
- Página local respondeu por HTTP com status 200.
- Interface inspecionada em desktop e largura de 390 px. Campos, contagem e botões permaneceram legíveis.

## Cenários no navegador de desktop

- Configuração inválida `00:00` para exercício mostrou erro e impediu o início.
- Configuração válida reapareceu após recarregar a página.
- Um exercício e um set exibiram a preparação de 3 segundos antes do exercício e terminaram sem descanso extra.
- Dois exercícios e dois sets com transição e descanso seguiram até a conclusão automática.
- Com transição e descanso zero, apareceram os quatro exercícios na ordem esperada, precedidos por 3 segundos de preparação em cada set e sem fase `00:00`.
- Na revisão da preparação, um exercício em dois sets com 1 segundo de descanso seguiu `preparação 1 → exercício 1 → descanso → preparação 2 → exercício 1 → conclusão`; o total planejado mostrou `00:09` e a tela de 390 px não teve rolagem horizontal.
- A pausa manual manteve `00:08` durante 10 segundos e continuou a partir dali.
- Ao simular página oculta, o tempo permaneceu pausado após 16 segundos; ao voltar, exigiu toque em **Continuar**.
- Dois envios seguidos do formulário na primeira fase produziram um único aviso inicial no adaptador de áudio simulado.
- Pausa feita logo após uma virada de fase preservou o aviso dessa fase para a retomada, no adaptador simulado.
- Falha simulada de armazenamento exibiu o aviso de que a configuração não foi salva; a contagem continuou.
- Ausência simulada de áudio e Wake Lock exibiu avisos, mantendo o timer ativo. Uma segunda tentativa bem-sucedida de Wake Lock removeu o aviso de tela.

## Ainda não verificado

- Publicação por HTTPS e URL definitiva: aguardam aprovação e acesso à conta de hospedagem.
- Som audível, comportamento com volume/modo silencioso, tela acesa e saída do Safari em iPhone real. Testes e simulações em desktop não confirmam esses pontos.
