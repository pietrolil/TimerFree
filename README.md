# TimerFree

Timer de treino em circuito para usar no navegador do iPhone ou de outro aparelho.
Configure a duração de cada exercício, a transição entre exercícios, o descanso
entre sets e as quantidades de exercícios e sets. O treino avança sozinho até o
fim; cada set começa com 3 segundos fixos de preparação, inclusive o primeiro.
A transição e o descanso podem ser zero.

## Usar

1. Abra a página por HTTPS no Safari.
2. Ajuste os campos e toque em **Iniciar treino**. Aparecem 3 segundos de
   preparação antes do primeiro exercício e antes dos exercícios de cada
   set seguinte. O tempo total planejado aparece antes de iniciar.
3. Mantenha a página visível durante o treino. Se sair dela, o timer pausa e
   espera você tocar em **Continuar**.
4. Use **Pausar** ou **Encerrar** quando precisar.

O site tenta manter a tela acesa durante a contagem e emitir um som em cada
mudança de fase e ao concluir. Se o navegador não permitir som ou tela acesa,
o contador visual continua funcionando e mostra um aviso. O volume e o modo
silencioso do aparelho podem afetar os sons. As últimas configurações ficam
salvas somente no navegador; o treino em andamento não é recuperado após
recarregar a página.

## Publicar o arquivo único

O arquivo [index.html](index.html) já contém todo o CSS e JavaScript necessário.
Para publicar com Cloudflare Pages Direct Upload, envie uma pasta ou ZIP que
contenha **apenas `index.html`** e abra a URL HTTPS fornecida pela hospedagem.
Não é necessário servidor de aplicação, conta no TimerFree ou banco de dados.
A página publicada fica acessível a quem tiver o endereço; ela não contém
dados pessoais e não sincroniza configurações.

O comportamento de áudio, tela acesa e troca de aplicativo precisa ser
conferido no Safari de um iPhone real depois da publicação em HTTPS.

## Desenvolver

Requer Node.js e npm. Os arquivos de `src/` são separados para facilitar
manutenção e testes; só o `index.html` gerado deve ser publicado.

```text
npm ci
npm test
npm run build
npm run serve
```

A prévia local abre em `http://127.0.0.1:4173/`. O pacote `esbuild` é usado
somente para gerar o HTML; ele não é carregado durante o treino.
