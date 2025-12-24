/**
 * Privacy Policy Page
 */
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPage() {
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

        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-8">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introdução</h2>
            <p className="text-muted-foreground leading-relaxed">
              O Horas Líquidas valoriza a privacidade dos seus usuários. Esta Política de
              Privacidade explica como coletamos, usamos, armazenamos e protegemos suas
              informações pessoais quando você utiliza nosso serviço de gerenciamento de estudos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Informações que Coletamos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Coletamos os seguintes tipos de informações:
            </p>

            <h3 className="text-lg font-medium mt-4 mb-2">2.1 Informações de Conta</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Nome e endereço de e-mail (quando você cria uma conta)</li>
              <li>Foto de perfil (se fornecida através do login social)</li>
              <li>Preferências de conta e configurações</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">2.2 Dados de Estudo</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Sessões de estudo registradas (data, matéria, duração)</li>
              <li>Metas semanais definidas</li>
              <li>Histórico de atividades e progresso</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">2.3 Dados Técnicos</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Endereço IP e tipo de navegador</li>
              <li>Sistema operacional e tipo de dispositivo</li>
              <li>Páginas visitadas e tempo de uso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Como Usamos Suas Informações</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>Fornecer e manter o serviço Horas Líquidas</li>
              <li>Personalizar sua experiência e exibir seu progresso</li>
              <li>Gerar estatísticas e dashboards de estudo</li>
              <li>Enviar notificações sobre suas metas (se habilitado)</li>
              <li>Melhorar nosso serviço e desenvolver novos recursos</li>
              <li>Comunicar atualizações importantes sobre o serviço</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Armazenamento e Segurança</h2>
            <p className="text-muted-foreground leading-relaxed">
              Seus dados são armazenados em servidores seguros. Implementamos medidas de
              segurança técnicas e organizacionais para proteger suas informações contra
              acesso não autorizado, alteração, divulgação ou destruição. Isso inclui:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>Criptografia de dados em trânsito (HTTPS)</li>
              <li>Senhas armazenadas com hash seguro</li>
              <li>Acesso restrito aos dados do usuário</li>
              <li>Backups regulares dos dados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros
              para fins de marketing. Podemos compartilhar dados apenas nas seguintes situações:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>Com seu consentimento explícito</li>
              <li>Para cumprir obrigações legais</li>
              <li>Para proteger nossos direitos e segurança</li>
              <li>Com prestadores de serviço que nos auxiliam (hospedagem, analytics)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Seus Direitos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você tem os seguintes direitos em relação aos seus dados:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li><strong>Acesso:</strong> Solicitar uma cópia dos seus dados pessoais</li>
              <li><strong>Correção:</strong> Corrigir dados imprecisos ou incompletos</li>
              <li><strong>Exclusão:</strong> Solicitar a exclusão dos seus dados</li>
              <li><strong>Portabilidade:</strong> Exportar seus dados em formato legível</li>
              <li><strong>Restrição:</strong> Limitar o processamento dos seus dados</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Para exercer esses direitos, acesse as configurações da sua conta ou entre em contato conosco.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Cookies e Tecnologias Similares</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies e tecnologias similares para:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>Manter você conectado à sua conta</li>
              <li>Lembrar suas preferências (tema, configurações)</li>
              <li>Entender como você usa o serviço</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Você pode configurar seu navegador para recusar cookies, mas isso pode afetar
              a funcionalidade do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Retenção de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para
              fornecer o serviço. Se você excluir sua conta, removeremos seus dados pessoais
              em até 30 dias, exceto quando a retenção for necessária para fins legais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Menores de Idade</h2>
            <p className="text-muted-foreground leading-relaxed">
              O Horas Líquidas não é direcionado a menores de 13 anos. Não coletamos
              intencionalmente informações de crianças. Se você é pai/mãe ou responsável e
              acredita que seu filho nos forneceu informações, entre em contato para que
              possamos remover esses dados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Alterações nesta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos
              sobre alterações significativas através do aplicativo ou por e-mail.
              Recomendamos revisar esta página regularmente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como
              tratamos seus dados, entre em contato conosco através das configurações
              do aplicativo.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link
            to="/terms"
            className="text-primary hover:underline"
          >
            Ver Termos de Uso
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;
