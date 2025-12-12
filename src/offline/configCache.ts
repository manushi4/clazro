import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CustomerConfig } from "../types/config.types";

function keyForCustomer(slug: string) {
  return `cached_customer_config_${slug}`;
}

export async function saveCustomerConfigToCache(slug: string, config: CustomerConfig) {
  try {
    await AsyncStorage.setItem(keyForCustomer(slug), JSON.stringify(config));
  } catch {
    // ignore cache errors
  }
}

export async function loadCustomerConfigFromCache(slug: string): Promise<CustomerConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(keyForCustomer(slug));
    if (!raw) return null;
    return JSON.parse(raw) as CustomerConfig;
  } catch {
    return null;
  }
}
