import { Injectable } from '@nestjs/common';
import { auth } from './auth.config';

@Injectable()
export class AuthService {
  /**
   * Valida uma sessão de usuário usando o token
   */
  async validateSession(token: string) {
    try {
      const session = await auth.api.getSession({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      return session;
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtém informações do usuário autenticado
   */
  async getCurrentUser(token: string) {
    const session = await this.validateSession(token);
    if (!session || !session.user) {
      return null;
    }
    return session.user;
  }

  /**
   * Faz logout do usuário
   */
  async logout(token: string) {
    try {
      await auth.api.signOut({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      return { success: true };
    } catch (error) {
      throw new Error('Failed to logout');
    }
  }

  /**
   * Retorna a instância do auth para uso em controllers
   */
  getAuthInstance() {
    return auth;
  }
}
