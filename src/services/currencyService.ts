import { supabase } from '../utils/supabaseClient';
import { withTimeout } from '../utils/queryUtils';

export interface CurrencyRate {
  id: string;
  code: string;
  symbol: string;
  label: string;
  rate_to_usd: number;
  updated_at: string;
}

export const currencyService = {
  async getRates(): Promise<CurrencyRate[]> {
    const { data, error } = await withTimeout(
      (supabase
        .from('currency_rates')
        .select('*')
        .order('code', { ascending: true })) as any,
      15000,
      'getRates'
    );

    if (error) throw error;
    return data || [];
  },

  async updateRate(code: string, newRate: number) {
    const { error } = await withTimeout(
      (supabase
        .from('currency_rates')
        .update({ 
          rate_to_usd: newRate,
          updated_at: new Date().toISOString()
        })
        .eq('code', code)) as any,
      15000,
      'updateRate'
    );

    if (error) throw error;
  }
};