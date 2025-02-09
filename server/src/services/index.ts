import config, { type ConfigService } from './config';
import permalinks, { type PermalinksService } from './permalinks';
import validation, { type ValidationService } from './validation';

export type PermalinksServices = {
  config: ConfigService;
  permalinks: PermalinksService;
  validation: ValidationService;
};

export default {
  config,
  permalinks,
  validation,
};
