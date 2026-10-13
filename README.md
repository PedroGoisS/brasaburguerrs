# Brasa Burger

Site de pedidos com painel do vendedor em `/vendedor`, categorias editáveis, adicionais por produto/categoria, carrinho personalizado e cálculo de entrega.

## Estado atual

- Categorias, produtos, adicionais, configurações e pedidos são salvos neste navegador. Não há sincronização entre dispositivos.
- O acesso do vendedor é de demonstração; não constitui autenticação segura para produção. Ocultar o link público não altera essa limitação.
- Os horários e o indicador automático seguem o fuso de Brasília; datas especiais continuam sendo respeitadas, sem aviso de Natal no topo.
- Os adicionais são cobrados por unidade do produto. Variações diferentes ficam separadas no carrinho e os detalhes são preservados no pedido e na mensagem do WhatsApp.
- A exclusão de categoria com produtos exige selecionar outra categoria para recebê-los.
- Pedidos por retirada não cobram taxa. A confirmação de distâncias reais do Google Maps em origem autorizada continua pendente.
- Contatos e endereço iniciais são exemplos; cadastre os dados reais antes de receber pedidos.

## Código exportado

O arquivo exportado não inclui segredos, dependências instaladas nem arquivos gerados de compilação. Instale as dependências com `bun install` e inicie com `bun run dev`. Execute os testes com `bunx vitest run`.

A integração de entrega depende dos serviços e segredos configurados no projeto Lovable Cloud e do conector Google Maps; copiar o código não transfere essa configuração. Não coloque chaves privadas no navegador ou no repositório.

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
