/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { registerKeepAliveTask } from 'skymatch-peripheral/background';
import App from './App';
import { name as appName } from './app.json';

// Android keeps the mesh running in the background through this task; it
// has to be registered before anything can start it.
registerKeepAliveTask();
AppRegistry.registerComponent(appName, () => App);
