/**
 * Terms of Service Page
 */
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-muted-foreground mb-8">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e usar o Study Planner, você concorda em cumprir estes Termos de Uso.
              Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              O Study Planner é uma plataforma de gerenciamento de estudos que permite aos usuários:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>Registrar sessões de estudo por matéria</li>
              <li>Definir e acompanhar metas semanais de estudo</li>
              <li>Visualizar estatísticas e progresso através de dashboards</li>
              <li>Acompanhar atividades em calendário e heatmap anual</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Cadastro e Conta</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para utilizar o Study Planner, você deve criar uma conta fornecendo informações
              precisas e completas. Você é responsável por manter a confidencialidade de sua
              conta e senha, e por todas as atividades que ocorram em sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Uso Aceitável</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você concorda em usar o Study Planner apenas para fins legais e de acordo com
              estes Termos. Você não deve:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>Usar o serviço de forma que possa danificar, desabilitar ou sobrecarregar nossos servidores</li>
              <li>Tentar obter acesso não autorizado a qualquer parte do serviço</li>
              <li>Usar o serviço para qualquer finalidade ilegal ou não autorizada</li>
              <li>Transmitir vírus ou qualquer código de natureza destrutiva</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Propriedade Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              O Study Planner e seu conteúdo original, recursos e funcionalidades são de
              propriedade exclusiva dos desenvolvedores. O serviço é protegido por leis de
              direitos autorais e outras leis de propriedade intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Seus Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você mantém todos os direitos sobre os dados que insere no Study Planner,
              incluindo suas sessões de estudo, matérias e configurações. Você pode exportar
              ou excluir seus dados a qualquer momento através das configurações da conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              O Study Planner é fornecido "como está", sem garantias de qualquer tipo.
              Não garantimos que o serviço será ininterrupto, seguro ou livre de erros.
              Em nenhum caso seremos responsáveis por quaisquer danos indiretos, incidentais
              ou consequentes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Modificações do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar ou descontinuar o serviço a qualquer momento,
              com ou sem aviso prévio. Não seremos responsáveis perante você ou terceiros por
              qualquer modificação, suspensão ou descontinuação do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Alterações nos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar estes Termos de Uso periodicamente. Notificaremos sobre
              quaisquer alterações publicando os novos Termos nesta página. Recomendamos
              revisar estes Termos periodicamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco
              através das configurações do aplicativo.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link
            to="/privacy"
            className="text-primary hover:underline"
          >
            Ver Política de Privacidade
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
