import { loadSettings } from '../config';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

export interface ApiClientOptions {
  token: string;
}

export class ApiClient {
  private baseUrl: string = '';
  private token: string;

  constructor(options: ApiClientOptions) {
    this.token = options.token;
  }

  async init(): Promise<void> {
    const settings = await loadSettings();
    this.baseUrl = settings.backendUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>
  ): Promise<T> {
    if (!this.baseUrl) {
      await this.init();
    }

    let url = `${this.baseUrl}${path}`;

    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Cookie: `better-auth.session_token=${this.token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new ApiError(response.status, response.statusText, errorBody);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text) as T;
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, undefined, params);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  async delete<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('DELETE', path, undefined, params);
  }
}

let apiClient: ApiClient | null = null;

export function getApiClient(token: string): ApiClient {
  if (!apiClient) {
    apiClient = new ApiClient({ token });
  }
  return apiClient;
}

export function resetApiClient(): void {
  apiClient = null;
}
