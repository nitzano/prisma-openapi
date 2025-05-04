#!/usr/bin/env node

import {generatorHandler} from './index.js';

// Execute the generator handler when called directly
// This ensures the CLI works when installed
generatorHandler();
