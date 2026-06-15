export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqCategory {
  id: string;
  title: string;
  items: FaqItem[];
}

export const faqData: FaqCategory[] = [
  {
    id: "conta",
    title: "Conta e Acesso",
    items: [
      { q: "Como faço meu cadastro no ZUP?", a: "Acesse a tela de Criar Conta, informe nome completo, CPF, telefone, CEP e e-mail. O CPF é validado automaticamente e é único por usuário." },
      { q: "Esqueci minha senha. O que faço?", a: "Use o link 'Esqueci minha senha' na tela de login. Você receberá instruções no e-mail cadastrado." },
      { q: "Posso me cadastrar sem CPF?", a: "Não. O CPF é obrigatório para evitar duplicidade e garantir a integridade das denúncias." },
      { q: "Por que preciso informar telefone e CEP?", a: "São usados para localizar a região do morador e, eventualmente, contatá-lo sobre denúncias críticas. Os dados seguem a LGPD." },
    ],
  },
  {
    id: "denuncias",
    title: "Denúncias",
    items: [
      { q: "Como abrir uma denúncia?", a: "Acesse 'Meu Painel' e clique em 'Nova Denúncia'. Escolha a categoria, descreva o problema, envie fotos e marque o local no mapa." },
      { q: "Por que minha denúncia ainda não apareceu publicamente?", a: "Toda denúncia passa por uma etapa de pré-publicação e validação comunitária antes de ficar visível para todos." },
      { q: "Como funciona a pré-publicação?", a: "Após criar a denúncia, ela fica em pré-publicação por até 12h. Nesse período, você pode editar título, descrição e fotos. Depois disso, ela é encaminhada para validação." },
      { q: "Posso editar ou excluir minha denúncia?", a: "Sim, durante a janela de 12h após a criação. Após esse prazo, a denúncia se torna pública e não pode ser alterada pelo autor." },
      { q: "Quantas fotos posso anexar?", a: "Recomendamos pelo menos uma foto principal e outras complementares para facilitar o trabalho do órgão responsável." },
    ],
  },
  {
    id: "status",
    title: "Status da Denúncia",
    items: [
      { q: "O que significa cada status?", a: "Pré-publicação (em ajuste pelo autor) → Aguardando validação (comunidade votando) → Em análise (órgão recebeu) → Em execução (trabalho em campo) → Resolvido pelo órgão → Resolução validada (confirmada pela comunidade) ou Rejeitada." },
      { q: "Como funciona a resolução validada?", a: "Quando o órgão marca uma denúncia como resolvida, a comunidade confirma se o problema foi de fato solucionado. Só então ela é fechada definitivamente." },
      { q: "O que acontece se o problema voltar?", a: "Qualquer usuário pode reabrir uma denúncia resolvida, gerando um novo ciclo vinculado ao registro original (recorrência)." },
      { q: "Por que minha denúncia foi reclassificada?", a: "O órgão pode ajustar a categoria ou o órgão responsável se identificar que a denúncia se encaixa melhor em outra área." },
    ],
  },
  {
    id: "validacao",
    title: "Validação Comunitária",
    items: [
      { q: "Como funciona a validação?", a: "Moradores próximos são convidados a confirmar que a denúncia é real e relevante. Cada denúncia precisa de pelo menos 2 validações antes de ser encaminhada ao órgão." },
      { q: "Por que não fui selecionado para validar?", a: "A seleção considera proximidade geográfica e um cooldown de 6 semanas entre convites, para distribuir a participação." },
      { q: "Por que não consigo validar uma ocorrência?", a: "Só é possível validar denúncias para as quais você recebeu um convite ativo dentro do prazo (24h)." },
      { q: "Quanto tempo tenho para votar?", a: "Os convites de validação expiram em 24 horas." },
    ],
  },
  {
    id: "privacidade",
    title: "Privacidade e Segurança",
    items: [
      { q: "Minhas denúncias são anônimas?", a: "Para o público, sim. O nome do autor não aparece. Apenas administradores e o órgão responsável têm acesso para fins de atendimento." },
      { q: "Como meus dados são usados?", a: "Apenas para atendimento das denúncias e comunicação institucional, conforme a LGPD (Lei nº 13.709/2018)." },
      { q: "Quem pode ver minhas informações pessoais?", a: "Somente você e administradores autorizados. Órgãos veem apenas dados necessários para resolver a denúncia." },
    ],
  },
  {
    id: "orgaos",
    title: "Órgãos e Categorias",
    items: [
      { q: "Quais órgãos atuam no ZUP?", a: "Prefeitura, VISAN (Água e Saneamento), CELESC (Energia e Iluminação), Vandalismo e Gestão Municipal." },
      { q: "Como sei a qual órgão minha denúncia foi encaminhada?", a: "O órgão responsável aparece no detalhe da denúncia e é definido automaticamente pela categoria escolhida." },
    ],
  },
  {
    id: "tecnico",
    title: "Problemas Técnicos",
    items: [
      { q: "Erro ao enviar foto", a: "Verifique sua conexão e o tamanho do arquivo (máximo recomendado 5 MB por imagem). Tente novamente após alguns segundos." },
      { q: "O mapa não carrega", a: "Atualize a página. Em alguns casos, bloqueadores de conteúdo impedem o carregamento dos tiles do mapa." },
      { q: "A página está lenta", a: "Limpe o cache do navegador e verifique sua conexão. Se persistir, entre em contato com o suporte." },
    ],
  },
  {
    id: "minha-cidade",
    title: "Minha Cidade e Gestão",
    items: [
      { q: "Como leio os dashboards de Minha Cidade?", a: "Os painéis mostram estatísticas agregadas: total por categoria, bairro, status e tempo médio de resolução." },
      { q: "O que é o mapa de calor?", a: "Visualização das áreas com maior concentração de denúncias, ajudando a priorizar ações." },
      { q: "O que é recorrência?", a: "Indica problemas que foram reabertos após serem marcados como resolvidos." },
    ],
  },
];
