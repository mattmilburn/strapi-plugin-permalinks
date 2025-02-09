import { PLUGIN_ID } from '../constants';
import { type PermalinksServices } from '../services';

const getService = <TName extends keyof PermalinksServices>(
  name: TName
): PermalinksServices[TName] =>
  global.strapi.plugin(PLUGIN_ID).service<PermalinksServices[TName]>(name);

export default getService;
