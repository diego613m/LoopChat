import './tracing';
import './models';

/**
 * ./settings uses top level await, in theory the settings creation
 * and the startup should be done in parallel
 */
import './settings';

import { configureServer } from './configuration';
import { registerServices } from './services/startup';
import { startup } from './startup';
import { startRestAPI } from '../app/api/server/api';
import { settings } from '../app/settings/server';
import { startupApp } from '../ee/server';
import { startRocketChat } from '../startRocketChat';

import './routes';
import '../app/lib/server/startup';
import './importPackages';
import './methods';
import './publications';
import '../lib/oauthRedirectUriServer';
import './lib/pushConfig';
import './features/EmailInbox/index';
import './siatc'; // Fase 2 del plan de migración al Ecosistema SIATC — hooks de aprobación SSO

await Promise.all([configureServer(settings), registerServices(), startup()]);

await startRocketChat();
await startupApp();
await startRestAPI();
