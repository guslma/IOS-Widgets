# F1 Widget

Widget para Scriptable (iOS) que mostra o calendário da Fórmula 1 direto na tela inicial e na tela bloqueada do iPhone, com dados gratuitos da [OpenF1](https://openf1.org).

## O que ele mostra

**Widget grande (tela inicial, tamanho médio):**
- Bandeira/rodada da temporada, país e circuito do próximo GP
- Data do fim de semana
- Traçado da pista, desenhado na hora com a cor associada ao país, incluindo a linha de largada quadriculada e uma seta indicando o sentido da corrida
- Lista das sessões (treinos, classificação, corrida) com dia, dia da semana e horário
- Sessões que já aconteceram ficam esmaecidas; a que está rolando agora fica em vermelho

**Widget da tela bloqueada:**
- Contagem regressiva pra próxima corrida
- Nome do GP
- Ícone monocromático do traçado da pista

**Notificações:**
- Aviso 10 minutos antes de cada sessão começar
- Aviso quando a sessão começa

## Como funciona

- Todos os horários vêm da API [OpenF1](https://openf1.org) (gratuita, sem necessidade de chave).
- O traçado das pistas vem da [multiviewer.app](https://api.multiviewer.app). Quando ela não tem o circuito cadastrado, usamos um traçado fixo extraído manualmente do diagrama oficial no Wikimedia Commons. Casos especiais atuais:
  - **Madrid** ("Madring", circuit_key 153) — circuito novo pra 2026, ainda não cadastrado na multiviewer.app.
  - **Bahrein/Sepang** (circuit_key 12) — o GP do Bahrein 2026 foi realocado pro Circuito Internacional de Sepang (Malásia); a OpenF1 chama esse evento de "Bahrain Grand Prix" com localização "Kuala Lumpur", mas a multiviewer.app não tem esse circuito cadastrado.
- **Dado ao vivo durante uma sessão** (posição dos pilotos em tempo real) não está disponível — a OpenF1 restringe esse tipo de dado a assinantes pagos. O widget usa só os horários programados, que são sempre gratuitos.

## Instalação

### Se você só quer usar (recomendado)

O arquivo [`loader.js`](./loader.js) é um script fixo e pequeno: ele busca a versão mais recente do [`f1-widget.js`](./f1-widget.js) deste repositório e executa, então você nunca precisa reinstalar manualmente quando o script for atualizado — tudo roda a partir de um único script no seu Scriptable.

1. Abra o app **Scriptable** no iPhone.
2. Crie um script novo (ex: "F1-Widget") e cole o conteúdo do arquivo [`loader.js`](./loader.js) deste repositório.
3. Adicione o widget na tela inicial (tamanho **médio**) e/ou na tela bloqueada, apontando pro script criado.

O widget atualiza sozinho no ritmo que o próprio iOS decide (geralmente entre 15 e 70 minutos) — sem precisar reinstalar nada quando o código deste repositório mudar.

Detalhe técnico: o `loader.js` baixa o código, confere se o download não veio cortado, guarda uma cópia local como cache (`F1-Widget-code-cache.txt`, não aparece como script) e só então executa — se a rede falhar, ele cai de volta pra última cópia salva.

### Arquivo do logo

O widget usa o ícone da F1 (`F1-mark.png` deste repositório). O `loader.js` baixa esse arquivo automaticamente na primeira execução e salva na pasta do Scriptable no iCloud — não precisa fazer nada manualmente.

## Estrutura do repositório

```
F1/
├── README.md       — este arquivo
├── loader.js       — script fixo que o usuário instala no Scriptable (nunca muda)
├── f1-widget.js    — lógica real do widget (atualizada com frequência)
└── F1-mark.png     — logo usado no widget
```

## Limitações conhecidas

- Enquanto qualquer sessão de F1 estiver ao vivo em algum lugar do mundo, a OpenF1 bloqueia acesso gratuito a **todos** os endpoints (inclusive o calendário). O widget guarda em cache a última grade buscada com sucesso e usa ela como alternativa nesse período.
- Os traçados de Madrid e Bahrein/Sepang são fixos no código até a multiviewer.app adicionar esses circuitos oficialmente.
