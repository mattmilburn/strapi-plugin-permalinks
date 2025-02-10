const isApiRequest = (ctx: any): boolean => ctx?.state?.route?.info?.type === 'content-api';

export default isApiRequest;
