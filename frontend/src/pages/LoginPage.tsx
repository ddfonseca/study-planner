/**
 * Login Page with Google OAuth and Email/Password (dev only)
 */
import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail } from 'lucide-react';

// Google Icon SVG
function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function LoginPage() {
  const { login, loginWithEmail, signUpWithEmail, isAuthenticated, isLoading, error, isEmailAuthEnabled, checkSession } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Email auth state (dev only)
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const emailAuthEnabled = isEmailAuthEnabled();

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app/calendar';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleLogin = () => {
    login();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let success: boolean;

    if (isSignUp) {
      success = await signUpWithEmail(email, password, name);
    } else {
      success = await loginWithEmail(email, password);
    }

    if (success) {
      // Check session after successful login
      await checkSession();
    }
  };

  return (
    <Card className="bg-container shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Bem-vindo!</CardTitle>
        <CardDescription>
          Entre com sua conta Google para começar a organizar seus estudos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <GoogleIcon />
          )}
          <span className="ml-3 font-medium">Entrar com Google</span>
        </Button>

        {/* Email/Password auth - DEV ONLY */}
        {emailAuthEnabled && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Dev Only
                </span>
              </div>
            </div>

            {!showEmailForm ? (
              <Button
                variant="outline"
                onClick={() => setShowEmailForm(true)}
                className="w-full h-12"
              >
                <Mail className="h-5 w-5 mr-2" />
                Entrar com Email (Dev)
              </Button>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {isSignUp && (
                  <div className="space-y-1">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignUp}
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isSignUp ? 'Criar conta' : 'Entrar'}
                </Button>

                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="w-full text-sm"
                >
                  {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar'}
                </Button>
              </form>
            )}
          </>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p>Ao entrar, você concorda com nossos</p>
          <p>
            <Link to="/terms" className="text-primary hover:underline">
              Termos de Uso
            </Link>
            {' e '}
            <Link to="/privacy" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default LoginPage;
