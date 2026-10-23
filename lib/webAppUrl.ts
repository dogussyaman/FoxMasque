import { Platform } from 'react-native';

export function getWebAppUrl(path: string): string {
  if (Platform.OS !== 'web') {
    throw new Error('Web uygulama URL’si yalnızca web platformunda oluşturulabilir.');
  }

  const baseUrl = process.env.EXPO_PUBLIC_BASE_URL ?? '';
  const pathSegments = baseUrl.split('/').filter(Boolean);
  const basePath = pathSegments.length > 0 ? `/${pathSegments.join('/')}/` : '/';
  return new URL(path.replace(/^\/+/, ''), `${window.location.origin}${basePath}`).toString();
}
