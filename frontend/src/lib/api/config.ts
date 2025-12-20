/**
 * User Configuration API
 */
import { apiClient } from './client';
import type { UserConfig, UpdateConfigDto } from '@/types/api';

export const configApi = {
  /**
   * Get user configuration
   */
  async get(): Promise<UserConfig | null> {
    try {
      return await apiClient.get<UserConfig>('/api/config');
    } catch {
      // Return null if config doesn't exist yet
      return null;
    }
  },

  /**
   * Update user configuration
   */
  async update(config: UpdateConfigDto): Promise<UserConfig> {
    return apiClient.put<UserConfig, UpdateConfigDto>('/api/config', config);
  },
};

export default configApi;
