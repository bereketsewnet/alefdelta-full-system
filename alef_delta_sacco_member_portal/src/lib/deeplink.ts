// Deep Link Utility for Telegram Bot Integration

interface DeepLinkParams {
    chat_id?: string;
    member_id?: string;
    view?: string;
    resource_id?: string;
  }
  
  export function parseDeepLink(search: string): DeepLinkParams {
    const params = new URLSearchParams(search);
    return {
      chat_id: params.get('chat_id') || undefined,
      member_id: params.get('member_id') || undefined,
      view: params.get('view') || undefined,
      resource_id: params.get('resource_id') || undefined,
    };
  }
  
  export function createDeepLink(base: string, params: DeepLinkParams): string {
    const url = new URL(base);
    if (params.chat_id) url.searchParams.set('chat_id', params.chat_id);
    if (params.member_id) url.searchParams.set('member_id', params.member_id);
    if (params.view) url.searchParams.set('view', params.view);
    if (params.resource_id) url.searchParams.set('resource_id', params.resource_id);
    return url.toString();
  }
  
  export function getTargetRoute(params: DeepLinkParams): string {
    const { view, resource_id } = params;
    
    switch (view) {
      case 'dashboard':
        return '/client/dashboard';
      case 'accounts':
        return resource_id ? `/client/accounts/${resource_id}/transactions` : '/client/accounts';
      case 'loans':
        return resource_id ? `/client/loans/${resource_id}` : '/client/loans';
      case 'requests':
        return '/client/requests';
      case 'profile':
        return '/client/profile';
      case 'notifications':
        return '/client/notifications';
      default:
        return '/client/dashboard';
    }
  }
  